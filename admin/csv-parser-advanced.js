/**
 * 高度なCSVパーサー（Papa Parse統合）
 * ストリーミング処理対応、大容量ファイル対応（100MB以上）
 * エラーリカバリ機能付き
 * 
 * @version 1.0.0
 * @author Worker2
 */

class CSVParserAdvanced {
    constructor() {
        // Papa Parse設定
        this.config = {
            // 基本設定
            delimiter: '',  // 自動検出
            newline: '',    // 自動検出
            quoteChar: '"',
            escapeChar: '"',
            header: true,   // ヘッダー行として1行目を使用
            dynamicTyping: true,  // 数値の自動変換
            skipEmptyLines: true,
            
            // ストリーミング設定
            chunkSize: 1024 * 1024,  // 1MB chunks
            
            // エラーハンドリング
            maxErrors: 100,
            errorTolerance: 0.01,  // 1%のエラー許容
            
            // パフォーマンス設定
            worker: true,  // Web Workerを使用
            fastMode: false,  // 引用符の厳密なチェック
            
            // エンコーディング
            encoding: 'UTF-8',
            encodingFallback: ['Shift_JIS', 'EUC-JP', 'ISO-2022-JP']
        };
        
        // 処理統計
        this.stats = {
            totalRows: 0,
            processedRows: 0,
            errorRows: 0,
            skippedRows: 0,
            processingTime: 0,
            bytesProcessed: 0,
            currentChunk: 0
        };
        
        // エラーログ
        this.errors = [];
        
        // セキュリティレイヤー（存在する場合）
        this.securityLayer = window.SecurityLayer ? new window.SecurityLayer() : null;
    }

    /**
     * CSVファイルのストリーミング解析
     * @param {File} file - CSVファイル
     * @param {Object} options - オプション設定
     * @returns {Promise} 解析結果
     */
    async parseStream(file, options = {}) {
        return new Promise((resolve, reject) => {
            // オプションのマージ
            const config = { ...this.config, ...options };
            
            // 統計リセット
            this.resetStats();
            const startTime = performance.now();
            
            // 結果格納用
            const results = {
                data: [],
                meta: {},
                errors: [],
                warnings: []
            };
            
            // ストリーミング設定
            const streamConfig = {
                ...config,
                
                // ステップ関数（各行の処理）
                step: (row, parser) => {
                    this.stats.totalRows++;
                    
                    try {
                        // セキュリティチェック
                        if (this.securityLayer) {
                            const sanitized = this.sanitizeRow(row.data);
                            if (sanitized.hasIssues) {
                                results.warnings.push({
                                    row: this.stats.totalRows,
                                    type: 'security',
                                    message: sanitized.message
                                });
                            }
                            row.data = sanitized.data;
                        }
                        
                        // データ検証
                        const validation = this.validateRow(row.data, this.stats.totalRows);
                        if (!validation.isValid) {
                            this.handleRowError(validation.errors, row, results);
                            
                            // エラー許容度チェック
                            if (this.shouldAbortOnErrors()) {
                                parser.abort();
                                reject(new Error('エラー率が許容範囲を超えました'));
                                return;
                            }
                        } else {
                            results.data.push(row.data);
                            this.stats.processedRows++;
                        }
                        
                        // プログレスコールバック
                        if (options.onProgress) {
                            const progress = {
                                rowsProcessed: this.stats.totalRows,
                                bytesProcessed: this.stats.bytesProcessed,
                                percentage: Math.round((this.stats.bytesProcessed / file.size) * 100),
                                errors: this.stats.errorRows
                            };
                            options.onProgress(progress);
                        }
                        
                    } catch (error) {
                        this.handleProcessingError(error, row, results);
                    }
                },
                
                // チャンク完了時
                chunk: (chunk, parser) => {
                    this.stats.currentChunk++;
                    this.stats.bytesProcessed += chunk.length;
                    
                    // メモリ管理
                    if (this.stats.currentChunk % 10 === 0) {
                        this.performMemoryCleanup();
                    }
                    
                    // 中断チェック
                    if (options.abortSignal && options.abortSignal.aborted) {
                        parser.abort();
                        reject(new Error('処理が中断されました'));
                    }
                },
                
                // 完了時
                complete: (parseResults) => {
                    this.stats.processingTime = performance.now() - startTime;
                    
                    // メタデータ設定
                    results.meta = {
                        ...parseResults.meta,
                        totalRows: this.stats.totalRows,
                        processedRows: this.stats.processedRows,
                        errorRows: this.stats.errorRows,
                        skippedRows: this.stats.skippedRows,
                        processingTime: this.stats.processingTime,
                        throughput: this.calculateThroughput()
                    };
                    
                    // エラーサマリー
                    if (this.errors.length > 0) {
                        results.errorSummary = this.generateErrorSummary();
                    }
                    
                    resolve(results);
                },
                
                // エラー時
                error: (error, file) => {
                    console.error('Papa Parse Error:', error);
                    this.errors.push({
                        type: 'parse_error',
                        message: error.message,
                        row: error.row,
                        code: error.code
                    });
                    
                    // クリティカルエラーの場合は中断
                    if (this.isCriticalError(error)) {
                        reject(error);
                    }
                }
            };
            
            // エンコーディング検出と解析開始
            this.detectAndParse(file, streamConfig);
        });
    }

    /**
     * 同期的なCSV解析（小さいファイル用）
     * @param {string} csvText - CSVテキスト
     * @param {Object} options - オプション設定
     * @returns {Object} 解析結果
     */
    parseSync(csvText, options = {}) {
        const config = { ...this.config, ...options };
        
        try {
            const results = Papa.parse(csvText, config);
            
            // セキュリティチェックとデータクレンジング
            if (this.securityLayer && results.data) {
                results.data = results.data.map((row, index) => {
                    const sanitized = this.sanitizeRow(row);
                    if (sanitized.hasIssues) {
                        if (!results.warnings) results.warnings = [];
                        results.warnings.push({
                            row: index + 1,
                            message: sanitized.message
                        });
                    }
                    return sanitized.data;
                });
            }
            
            return results;
            
        } catch (error) {
            console.error('Sync parse error:', error);
            return {
                data: [],
                errors: [{ message: error.message }],
                meta: {}
            };
        }
    }

    /**
     * エンコーディング検出と解析
     */
    async detectAndParse(file, config) {
        // 最初の数KBを読み込んでエンコーディングを推測
        const sample = await this.readFileSample(file, 4096);
        const encoding = this.detectEncoding(sample);
        
        console.log(`Detected encoding: ${encoding}`);
        
        // Papa Parseで解析開始
        Papa.parse(file, {
            ...config,
            encoding: encoding,
            download: false,
            skipEmptyLines: true
        });
    }

    /**
     * ファイルサンプル読み込み
     */
    readFileSample(file, bytes) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const blob = file.slice(0, bytes);
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * エンコーディング検出
     */
    detectEncoding(buffer) {
        const arr = new Uint8Array(buffer);
        
        // BOMチェック
        if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
            return 'UTF-8';
        }
        if (arr[0] === 0xFF && arr[1] === 0xFE) {
            return 'UTF-16LE';
        }
        if (arr[0] === 0xFE && arr[1] === 0xFF) {
            return 'UTF-16BE';
        }
        
        // 日本語エンコーディングの簡易判定
        let hasMultiByte = false;
        let hasShiftJIS = false;
        
        for (let i = 0; i < arr.length - 1; i++) {
            // マルチバイト文字の検出
            if (arr[i] >= 0x80) {
                hasMultiByte = true;
                
                // Shift_JISの特徴的なパターン
                if ((arr[i] >= 0x81 && arr[i] <= 0x9F) || 
                    (arr[i] >= 0xE0 && arr[i] <= 0xFC)) {
                    if ((arr[i + 1] >= 0x40 && arr[i + 1] <= 0x7E) || 
                        (arr[i + 1] >= 0x80 && arr[i + 1] <= 0xFC)) {
                        hasShiftJIS = true;
                    }
                }
            }
        }
        
        if (hasShiftJIS) {
            return 'Shift_JIS';
        }
        
        return 'UTF-8';  // デフォルト
    }

    /**
     * 行データのサニタイズ
     */
    sanitizeRow(rowData) {
        if (!this.securityLayer) {
            return { data: rowData, hasIssues: false };
        }
        
        const issues = [];
        const sanitized = {};
        
        for (const [key, value] of Object.entries(rowData)) {
            if (typeof value === 'string') {
                // CSVインジェクションチェック
                if (this.securityLayer.isCSVInjection(value)) {
                    issues.push(`列「${key}」にCSVインジェクションの可能性`);
                    sanitized[key] = "'" + value;  // シングルクォートで無害化
                } else {
                    sanitized[key] = this.securityLayer.escapeHtml(value);
                }
            } else {
                sanitized[key] = value;
            }
        }
        
        return {
            data: sanitized,
            hasIssues: issues.length > 0,
            message: issues.join(', ')
        };
    }

    /**
     * 行データの検証
     */
    validateRow(rowData, rowNumber) {
        const errors = [];
        
        // 空行チェック
        if (!rowData || Object.keys(rowData).length === 0) {
            return {
                isValid: false,
                errors: [`行${rowNumber}: 空行`]
            };
        }
        
        // 必須フィールドチェック（カスタマイズ可能）
        if (this.requiredFields && this.requiredFields.length > 0) {
            for (const field of this.requiredFields) {
                if (!rowData.hasOwnProperty(field) || !rowData[field]) {
                    errors.push(`行${rowNumber}: 必須フィールド「${field}」が不足`);
                }
            }
        }
        
        // データ型チェック（カスタマイズ可能）
        if (this.fieldTypes) {
            for (const [field, type] of Object.entries(this.fieldTypes)) {
                if (rowData.hasOwnProperty(field)) {
                    const value = rowData[field];
                    if (!this.validateFieldType(value, type)) {
                        errors.push(`行${rowNumber}: フィールド「${field}」の型が不正（期待: ${type}）`);
                    }
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * フィールド型の検証
     */
    validateFieldType(value, expectedType) {
        switch (expectedType) {
            case 'number':
                return !isNaN(value) && isFinite(value);
            case 'integer':
                return Number.isInteger(Number(value));
            case 'date':
                return !isNaN(Date.parse(value));
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    }

    /**
     * 行エラーの処理
     */
    handleRowError(errors, row, results) {
        this.stats.errorRows++;
        
        const errorEntry = {
            row: this.stats.totalRows,
            data: row.data,
            errors: errors
        };
        
        this.errors.push(errorEntry);
        results.errors.push(errorEntry);
        
        // エラーリカバリー戦略
        if (this.config.errorRecovery) {
            const recovered = this.attemptErrorRecovery(row.data, errors);
            if (recovered) {
                results.data.push(recovered);
                this.stats.processedRows++;
                this.stats.errorRows--;  // リカバリー成功
            }
        }
    }

    /**
     * エラーリカバリー試行
     */
    attemptErrorRecovery(rowData, errors) {
        // 基本的なリカバリー戦略
        const recovered = { ...rowData };
        let hasRecovered = false;
        
        for (const error of errors) {
            // 空フィールドの補完
            if (error.includes('不足')) {
                const fieldMatch = error.match(/「(.+?)」/);
                if (fieldMatch) {
                    const field = fieldMatch[1];
                    recovered[field] = this.getDefaultValue(field);
                    hasRecovered = true;
                }
            }
            
            // 型エラーの修正
            if (error.includes('型が不正')) {
                const fieldMatch = error.match(/「(.+?)」/);
                if (fieldMatch) {
                    const field = fieldMatch[1];
                    const corrected = this.correctFieldType(recovered[field], this.fieldTypes[field]);
                    if (corrected !== null) {
                        recovered[field] = corrected;
                        hasRecovered = true;
                    }
                }
            }
        }
        
        return hasRecovered ? recovered : null;
    }

    /**
     * デフォルト値の取得
     */
    getDefaultValue(field) {
        // フィールドごとのデフォルト値設定
        const defaults = {
            'id': 0,
            'name': '未設定',
            'date': new Date().toISOString(),
            'status': 'active',
            'count': 0
        };
        
        return defaults[field] || '';
    }

    /**
     * フィールド型の修正
     */
    correctFieldType(value, targetType) {
        try {
            switch (targetType) {
                case 'number':
                    const num = parseFloat(value);
                    return isNaN(num) ? 0 : num;
                case 'integer':
                    const int = parseInt(value);
                    return isNaN(int) ? 0 : int;
                case 'date':
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
                default:
                    return String(value);
            }
        } catch {
            return null;
        }
    }

    /**
     * 処理エラーのハンドリング
     */
    handleProcessingError(error, row, results) {
        console.error('Processing error:', error);
        
        this.errors.push({
            type: 'processing_error',
            row: this.stats.totalRows,
            message: error.message,
            stack: error.stack
        });
        
        // 非クリティカルエラーの場合は続行
        if (!this.isCriticalError(error)) {
            this.stats.skippedRows++;
        }
    }

    /**
     * クリティカルエラーの判定
     */
    isCriticalError(error) {
        const criticalPatterns = [
            /out of memory/i,
            /maximum call stack/i,
            /security violation/i,
            /access denied/i
        ];
        
        return criticalPatterns.some(pattern => pattern.test(error.message));
    }

    /**
     * エラー許容度チェック
     */
    shouldAbortOnErrors() {
        if (this.stats.totalRows === 0) return false;
        
        const errorRate = this.stats.errorRows / this.stats.totalRows;
        return errorRate > this.config.errorTolerance && 
               this.stats.errorRows > this.config.maxErrors;
    }

    /**
     * メモリクリーンアップ
     */
    performMemoryCleanup() {
        // エラーログの制限
        if (this.errors.length > this.config.maxErrors * 2) {
            this.errors = this.errors.slice(-this.config.maxErrors);
        }
        
        // ガベージコレクションのヒント
        if (global.gc) {
            global.gc();
        }
    }

    /**
     * スループット計算
     */
    calculateThroughput() {
        if (this.stats.processingTime === 0) return 0;
        
        const rowsPerSecond = (this.stats.totalRows / this.stats.processingTime) * 1000;
        const mbPerSecond = (this.stats.bytesProcessed / (1024 * 1024)) / 
                           (this.stats.processingTime / 1000);
        
        return {
            rowsPerSecond: Math.round(rowsPerSecond),
            mbPerSecond: mbPerSecond.toFixed(2)
        };
    }

    /**
     * エラーサマリー生成
     */
    generateErrorSummary() {
        const summary = {
            total: this.errors.length,
            byType: {},
            topErrors: []
        };
        
        // エラータイプ別集計
        this.errors.forEach(error => {
            const type = error.type || 'unknown';
            summary.byType[type] = (summary.byType[type] || 0) + 1;
        });
        
        // トップエラー抽出
        const errorMessages = {};
        this.errors.forEach(error => {
            const msg = error.message || error.errors?.join(', ') || 'Unknown error';
            errorMessages[msg] = (errorMessages[msg] || 0) + 1;
        });
        
        summary.topErrors = Object.entries(errorMessages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([message, count]) => ({ message, count }));
        
        return summary;
    }

    /**
     * 統計のリセット
     */
    resetStats() {
        this.stats = {
            totalRows: 0,
            processedRows: 0,
            errorRows: 0,
            skippedRows: 0,
            processingTime: 0,
            bytesProcessed: 0,
            currentChunk: 0
        };
        this.errors = [];
    }

    /**
     * CSVエクスポート（処理済みデータ）
     */
    exportToCSV(data, filename = 'export.csv') {
        const csv = Papa.unparse(data, {
            quotes: true,
            delimiter: ',',
            header: true,
            newline: '\r\n'
        });
        
        // BOM付きUTF-8で出力（Excelとの互換性）
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        
        // ダウンロード
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    /**
     * 設定のカスタマイズ
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        
        // 特定フィールドの設定
        if (options.requiredFields) {
            this.requiredFields = options.requiredFields;
        }
        if (options.fieldTypes) {
            this.fieldTypes = options.fieldTypes;
        }
        if (options.errorRecovery !== undefined) {
            this.config.errorRecovery = options.errorRecovery;
        }
    }
}

// エクスポート
window.CSVParserAdvanced = CSVParserAdvanced;