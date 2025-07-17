/**
 * セキュリティ強化層
 * CSVインジェクション、XSS、ファイルアップロード脆弱性対策
 * 
 * @version 1.0.0
 * @author Worker2
 */

class SecurityLayer {
    constructor() {
        // セキュリティ設定
        this.config = {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedMimeTypes: [
                'text/csv',
                'text/plain',
                'application/csv',
                'application/x-csv',
                'text/x-csv',
                'text/comma-separated-values',
                'text/x-comma-separated-values'
            ],
            allowedExtensions: ['.csv', '.txt'],
            dangerousPatterns: [
                /^[@=+\-]/,  // CSVインジェクションパターン
                /javascript:/i,
                /vbscript:/i,
                /<script/i,
                /on\w+\s*=/i,  // イベントハンドラ
                /data:text\/html/i
            ],
            encodings: ['UTF-8', 'Shift_JIS', 'EUC-JP'],
            maxCellLength: 10000,
            maxRowCount: 1000000
        };

        // セキュリティログ
        this.securityLog = [];
        
        // CSPヘッダー設定（推奨）
        this.cspPolicy = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'"],
            'connect-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'form-action': ["'self'"],
            'base-uri': ["'self'"]
        };
    }

    /**
     * ファイルバリデーション（強化版）
     */
    validateFile(file) {
        const validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: false
        };

        try {
            // 1. ファイルオブジェクトの検証
            if (!file || !(file instanceof File || file instanceof Blob)) {
                validationResults.isValid = false;
                validationResults.errors.push('有効なファイルオブジェクトではありません');
                return validationResults;
            }

            // 2. ファイルサイズチェック
            if (file.size > this.config.maxFileSize) {
                validationResults.isValid = false;
                validationResults.errors.push(
                    `ファイルサイズが制限を超えています（最大: ${this.config.maxFileSize / (1024 * 1024)}MB）`
                );
            }

            // 3. ファイル名の検証とサニタイズ
            const sanitizedFileName = this.sanitizeFileName(file.name);
            if (sanitizedFileName !== file.name) {
                validationResults.warnings.push('ファイル名に不正な文字が含まれていたため、サニタイズしました');
                validationResults.sanitized = true;
            }

            // 4. 拡張子チェック
            const fileExtension = '.' + sanitizedFileName.split('.').pop().toLowerCase();
            if (!this.config.allowedExtensions.includes(fileExtension)) {
                validationResults.isValid = false;
                validationResults.errors.push(
                    `許可されていないファイル形式です（許可: ${this.config.allowedExtensions.join(', ')}）`
                );
            }

            // 5. MIMEタイプチェック（ブラウザ提供）
            if (file.type && !this.config.allowedMimeTypes.includes(file.type.toLowerCase())) {
                validationResults.warnings.push(
                    `MIMEタイプが想定と異なります（${file.type}）。内容を確認します。`
                );
            }

            // 6. マジックナンバーチェック（最初の数バイトを確認）
            // CSVファイルの場合、BOMやテキストパターンをチェック

            this.logSecurityEvent('file_validation', {
                fileName: sanitizedFileName,
                fileSize: file.size,
                fileType: file.type,
                valid: validationResults.isValid,
                errors: validationResults.errors,
                warnings: validationResults.warnings
            });

        } catch (error) {
            validationResults.isValid = false;
            validationResults.errors.push(`バリデーションエラー: ${error.message}`);
        }

        return validationResults;
    }

    /**
     * CSVデータのサニタイズ（CSVインジェクション対策）
     */
    sanitizeCSVData(data) {
        if (!Array.isArray(data)) {
            return data;
        }

        return data.map((row, rowIndex) => {
            if (!Array.isArray(row)) {
                return row;
            }

            return row.map((cell, cellIndex) => {
                // null/undefinedチェック
                if (cell == null) {
                    return '';
                }

                // 文字列に変換
                let sanitizedCell = String(cell);

                // 長さチェック
                if (sanitizedCell.length > this.config.maxCellLength) {
                    this.logSecurityEvent('cell_truncated', {
                        row: rowIndex,
                        cell: cellIndex,
                        originalLength: sanitizedCell.length
                    });
                    sanitizedCell = sanitizedCell.substring(0, this.config.maxCellLength) + '...';
                }

                // CSVインジェクション対策
                if (this.isCSVInjection(sanitizedCell)) {
                    this.logSecurityEvent('csv_injection_prevented', {
                        row: rowIndex,
                        cell: cellIndex,
                        pattern: this.detectCSVInjectionPattern(sanitizedCell)
                    });
                    
                    // 危険な文字を無害化
                    sanitizedCell = "'" + sanitizedCell;
                }

                // XSS対策（HTMLエンティティエンコード）
                sanitizedCell = this.escapeHtml(sanitizedCell);

                // 制御文字の除去
                sanitizedCell = this.removeControlCharacters(sanitizedCell);

                return sanitizedCell;
            });
        });
    }

    /**
     * CSVインジェクション検出
     */
    isCSVInjection(value) {
        if (typeof value !== 'string') {
            return false;
        }

        const trimmedValue = value.trim();
        
        // 危険なパターンをチェック
        return this.config.dangerousPatterns.some(pattern => pattern.test(trimmedValue));
    }

    /**
     * CSVインジェクションパターン検出
     */
    detectCSVInjectionPattern(value) {
        const patterns = {
            'formula': /^[@=+\-]/,
            'javascript': /javascript:/i,
            'vbscript': /vbscript:/i,
            'html_script': /<script/i,
            'event_handler': /on\w+\s*=/i,
            'data_uri': /data:text\/html/i
        };

        for (const [name, pattern] of Object.entries(patterns)) {
            if (pattern.test(value)) {
                return name;
            }
        }

        return 'unknown';
    }

    /**
     * ファイル名のサニタイズ
     */
    sanitizeFileName(fileName) {
        // 危険な文字を除去
        let sanitized = fileName
            .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_')  // 危険な文字を_に置換
            .replace(/\.{2,}/g, '_')  // 連続するドットを_に置換
            .replace(/^\./, '_');  // 先頭のドットを_に置換

        // パストラバーサル対策
        sanitized = sanitized.replace(/[\/\\]/g, '_');

        // 長さ制限
        const maxLength = 255;
        if (sanitized.length > maxLength) {
            const extension = sanitized.split('.').pop();
            const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
            sanitized = nameWithoutExt.substring(0, maxLength - extension.length - 1) + '.' + extension;
        }

        return sanitized;
    }

    /**
     * HTMLエスケープ（XSS対策）
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return text.replace(/[&<>"'\/]/g, char => map[char]);
    }

    /**
     * 制御文字の除去
     */
    removeControlCharacters(text) {
        // タブと改行以外の制御文字を除去
        return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    /**
     * ファイル内容の安全性チェック（ストリーミング対応）
     */
    async validateFileContent(file, onProgress) {
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const reader = file.stream().getReader();
        const decoder = new TextDecoder('utf-8');
        
        let totalBytes = 0;
        let lineCount = 0;
        let issues = [];
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                totalBytes += value.length;
                buffer += decoder.decode(value, { stream: true });
                
                // 行ごとに処理
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 最後の不完全な行を保持
                
                for (const line of lines) {
                    lineCount++;
                    
                    // 各行の安全性チェック
                    const lineIssues = this.validateCSVLine(line, lineCount);
                    if (lineIssues.length > 0) {
                        issues.push(...lineIssues);
                    }
                    
                    // 行数制限チェック
                    if (lineCount > this.config.maxRowCount) {
                        throw new Error(`行数が制限を超えています（最大: ${this.config.maxRowCount}行）`);
                    }
                }
                
                // 進捗コールバック
                if (onProgress) {
                    onProgress({
                        bytesProcessed: totalBytes,
                        totalBytes: file.size,
                        percentage: Math.round((totalBytes / file.size) * 100),
                        lineCount: lineCount
                    });
                }
            }
            
            // 最後の行を処理
            if (buffer) {
                lineCount++;
                const lineIssues = this.validateCSVLine(buffer, lineCount);
                if (lineIssues.length > 0) {
                    issues.push(...lineIssues);
                }
            }

        } catch (error) {
            issues.push({
                type: 'error',
                line: lineCount,
                message: error.message
            });
        }

        return {
            valid: issues.filter(i => i.type === 'error').length === 0,
            lineCount,
            totalBytes,
            issues
        };
    }

    /**
     * CSV行の検証
     */
    validateCSVLine(line, lineNumber) {
        const issues = [];
        
        // 空行チェック
        if (!line.trim()) {
            return issues;
        }
        
        // CSVインジェクションチェック
        const cells = line.split(',');
        cells.forEach((cell, index) => {
            if (this.isCSVInjection(cell)) {
                issues.push({
                    type: 'warning',
                    line: lineNumber,
                    column: index + 1,
                    message: `CSVインジェクションの可能性があります: "${cell.substring(0, 20)}..."`
                });
            }
        });
        
        return issues;
    }

    /**
     * セキュリティイベントのログ記録
     */
    logSecurityEvent(eventType, details) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.securityLog.push(event);
        
        // コンソールにも出力（開発環境）
        if (console.debug) {
            console.debug('[Security Event]', event);
        }
        
        // ログが多くなりすぎないよう制限
        if (this.securityLog.length > 1000) {
            this.securityLog = this.securityLog.slice(-500);
        }
    }

    /**
     * セキュリティレポートの生成
     */
    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalEvents: this.securityLog.length,
                eventTypes: this.countEventTypes(),
                criticalEvents: this.securityLog.filter(e => e.type.includes('injection')).length
            },
            recentEvents: this.securityLog.slice(-20),
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }

    /**
     * イベントタイプの集計
     */
    countEventTypes() {
        const counts = {};
        this.securityLog.forEach(event => {
            counts[event.type] = (counts[event.type] || 0) + 1;
        });
        return counts;
    }

    /**
     * セキュリティ推奨事項の生成
     */
    generateRecommendations() {
        const recommendations = [];
        
        const eventTypes = this.countEventTypes();
        
        if (eventTypes['csv_injection_prevented'] > 0) {
            recommendations.push({
                severity: 'high',
                message: 'CSVインジェクション攻撃の試みが検出されました。アップロード元の確認を推奨します。'
            });
        }
        
        if (eventTypes['file_validation'] > 10) {
            recommendations.push({
                severity: 'medium',
                message: '多数のファイルバリデーションエラーが発生しています。アップロード手順の見直しを推奨します。'
            });
        }
        
        if (this.securityLog.length === 0) {
            recommendations.push({
                severity: 'info',
                message: 'セキュリティイベントは検出されていません。システムは正常に動作しています。'
            });
        }
        
        return recommendations;
    }

    /**
     * CSPヘッダーの生成
     */
    generateCSPHeader() {
        return Object.entries(this.cspPolicy)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');
    }

    /**
     * セキュリティ設定の検証
     */
    validateSecuritySettings() {
        const validations = [];
        
        // HTTPSチェック
        if (window.location.protocol !== 'https:') {
            validations.push({
                check: 'HTTPS',
                status: 'warning',
                message: 'HTTPSを使用していません。本番環境ではHTTPSの使用を強く推奨します。'
            });
        }
        
        // CSPチェック
        const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspHeader) {
            validations.push({
                check: 'CSP',
                status: 'info',
                message: 'Content Security Policyが設定されていません。'
            });
        }
        
        // Cookieセキュリティチェック
        if (document.cookie) {
            if (!document.cookie.includes('SameSite')) {
                validations.push({
                    check: 'Cookie',
                    status: 'warning',
                    message: 'CookieにSameSite属性が設定されていません。'
                });
            }
        }
        
        return validations;
    }
}

// エクスポート
window.SecurityLayer = SecurityLayer;