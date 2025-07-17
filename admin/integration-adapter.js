/**
 * 統合アダプター
 * Worker1のUIとWorker2のCSV処理ロジックを連携
 */

class IntegrationAdapter {
    constructor() {
        this.csvManager = null;
        this.backupManager = null;
        this.fileUploader = null;
        this.adminManager = null;
        this.securityLayer = null;
        this.csvParserAdvanced = null;
        this.isInitialized = false;
    }

    /**
     * 初期化
     */
    async init() {
        try {
            // Worker2のモジュール初期化
            this.csvManager = new CSVManager();
            this.backupManager = new BackupManager();
            
            // セキュリティ層と高度なパーサーの初期化
            if (window.SecurityLayer) {
                this.securityLayer = new SecurityLayer();
                console.log('セキュリティレイヤー初期化完了');
            }
            
            if (window.CSVParserAdvanced) {
                this.csvParserAdvanced = new CSVParserAdvanced();
                console.log('高度なCSVパーサー初期化完了');
            }
            
            // Worker1のUIマネージャーを拡張
            this.enhanceAdminManager();
            
            this.isInitialized = true;
            console.log('統合アダプター初期化完了');
            
        } catch (error) {
            console.error('統合アダプター初期化エラー:', error);
            throw error;
        }
    }

    /**
     * Admin ManagerにCSV処理機能を追加
     */
    enhanceAdminManager() {
        const self = this;
        
        // 既存のprocessFileメソッドをオーバーライド
        if (window.csvAdminManager) {
            const originalProcessFile = window.csvAdminManager.processFile;
            
            window.csvAdminManager.processFile = async function(file, type) {
                // セキュリティレイヤーでファイル検証（100MBまで対応）
                if (self.securityLayer) {
                    const securityValidation = self.securityLayer.validateFile(file);
                    if (!securityValidation.isValid) {
                        this.showError(`セキュリティチェック失敗: ${securityValidation.errors.join(', ')}`);
                        return;
                    }
                    
                    // 警告がある場合は表示
                    if (securityValidation.warnings.length > 0) {
                        console.warn('セキュリティ警告:', securityValidation.warnings);
                    }
                }
                
                // Worker2のバリデーションを追加
                const validation = self.csvManager.validateFile(file);
                if (!validation.isValid) {
                    this.showError(validation.error);
                    return;
                }
                
                // 元の処理を実行
                await originalProcessFile.call(this, file, type);
            };
            
            // uploadFileメソッドを拡張
            const originalUploadFile = window.csvAdminManager.uploadFile;
            
            window.csvAdminManager.uploadFile = async function(file, type) {
                const statusEl = document.getElementById(`${type}-status`);
                const progressEl = document.getElementById(`${type}-progress`);
                const progressFill = progressEl.querySelector('.progress-fill');
                const progressText = progressEl.querySelector('.progress-text');
                
                try {
                    // プログレス表示開始
                    statusEl.textContent = '処理中...';
                    statusEl.className = 'upload-status processing';
                    progressEl.style.display = 'block';
                    
                    // Worker2のCSV処理を実行
                    progressFill.style.width = '20%';
                    progressText.textContent = '20% - ファイル検証中...';
                    
                    // データタイプマッピング
                    const dataTypeMap = {
                        'region': 'regions',
                        'items': 'clinics',
                        'ranking': 'rankings',
                        'stores': 'stores',
                        'store_view': 'store_views'
                    };
                    
                    const dataType = dataTypeMap[type] || type;
                    
                    progressFill.style.width = '40%';
                    progressText.textContent = '40% - CSV解析中...';
                    
                    let result;
                    
                    // 大容量ファイル（10MB以上）の場合は高度なパーサーを使用
                    if (file.size > 10 * 1024 * 1024 && self.csvParserAdvanced) {
                        console.log(`大容量ファイル検出 (${(file.size / (1024 * 1024)).toFixed(2)}MB): ストリーミング処理を使用`);
                        
                        // 進捗表示用のコールバック
                        const onProgress = (progress) => {
                            const percentage = Math.min(40 + (progress.percentage * 0.2), 60);
                            progressFill.style.width = percentage + '%';
                            progressText.textContent = `${Math.round(percentage)}% - 処理中 (${progress.rowsProcessed}行)...`;
                        };
                        
                        // データ型ごとの設定
                        const parserConfig = self.getParserConfigForType(dataType);
                        self.csvParserAdvanced.configure(parserConfig);
                        
                        result = await self.csvParserAdvanced.parseStream(file, { onProgress });
                    } else {
                        // 通常のパーサーを使用
                        result = await self.csvManager.parseCSV(file, dataType);
                    }
                    
                    progressFill.style.width = '60%';
                    progressText.textContent = '60% - データ検証中...';
                    
                    // セキュリティレイヤーでデータサニタイズ
                    if (self.securityLayer && result.data) {
                        result.data = self.securityLayer.sanitizeCSVData(result.data);
                    }
                    
                    // バックアップ作成
                    await self.backupManager.createBackup(dataType);
                    
                    progressFill.style.width = '80%';
                    progressText.textContent = '80% - バックアップ作成完了...';
                    
                    // データを保存
                    this.uploadedFiles.set(type, {
                        file: file,
                        data: result.data,
                        parsedData: result.data,
                        headers: result.meta.fields || Object.keys(result.data[0] || {}),
                        rowCount: result.data.length,
                        processingStats: result.meta
                    });
                    
                    progressFill.style.width = '100%';
                    progressText.textContent = '100% - 完了';
                    
                    // ステータス更新
                    statusEl.textContent = '✓ アップロード完了';
                    statusEl.className = 'upload-status success';
                    
                    // ファイル情報表示
                    this.updateFileInfo(type, file, result.data);
                    
                    // プレビューオプション更新
                    this.updatePreviewOptions();
                    
                    // 統計更新
                    this.updateStats();
                    
                    setTimeout(() => {
                        progressEl.style.display = 'none';
                        progressFill.style.width = '0%';
                    }, 1000);
                    
                } catch (error) {
                    console.error('ファイル処理エラー:', error);
                    statusEl.textContent = '✗ エラー';
                    statusEl.className = 'upload-status error';
                    progressEl.style.display = 'none';
                    this.showError(`ファイル処理中にエラーが発生しました: ${error.message}`);
                }
            };
            
            // validateAllメソッドを拡張
            window.csvAdminManager.validateAll = async function() {
                if (this.uploadedFiles.size === 0) {
                    this.showError('検証するファイルがありません。');
                    return;
                }
                
                let allValid = true;
                let errorMessages = [];
                
                for (const [type, fileData] of this.uploadedFiles) {
                    // データタイプマッピング
                    const dataTypeMap = {
                        'region': 'regions',
                        'items': 'clinics',
                        'ranking': 'rankings',
                        'stores': 'stores',
                        'store_view': 'store_views'
                    };
                    
                    const dataType = dataTypeMap[type] || type;
                    
                    // スキーマバリデーション
                    const schemaValidation = self.csvManager.validateSchema(fileData.parsedData, dataType);
                    if (!schemaValidation.isValid) {
                        allValid = false;
                        errorMessages.push(`${type}: ${schemaValidation.error}`);
                    }
                    
                    // データ型バリデーション
                    const typeValidation = self.csvManager.validateDataTypes(fileData.parsedData, dataType);
                    if (!typeValidation.isValid) {
                        allValid = false;
                        errorMessages.push(`${type}: ${typeValidation.error}`);
                    }
                    
                    // 重複チェック
                    const duplicateValidation = self.csvManager.checkDuplicates(fileData.parsedData, dataType);
                    if (!duplicateValidation.isValid) {
                        allValid = false;
                        errorMessages.push(`${type}: ${duplicateValidation.error}`);
                    }
                }
                
                if (allValid) {
                    this.showSuccess('すべてのデータが検証に合格しました。');
                } else {
                    this.showError('データ検証エラー:\n' + errorMessages.join('\n'));
                }
            };
        }
    }

    /**
     * 統合テスト実行
     */
    async runIntegrationTest() {
        console.log('=== 統合テスト開始 ===');
        
        const tests = [];
        
        // Papa Parse読み込みテスト
        tests.push({
            name: 'Papa Parse CDN',
            success: typeof Papa !== 'undefined',
            details: Papa ? 'Papa Parse利用可能' : 'Papa Parse未読み込み'
        });
        
        // CSVManager初期化テスト
        tests.push({
            name: 'CSVManager',
            success: this.csvManager !== null,
            details: this.csvManager ? '初期化済み' : '未初期化'
        });
        
        // BackupManager初期化テスト
        tests.push({
            name: 'BackupManager',
            success: this.backupManager !== null,
            details: this.backupManager ? '初期化済み' : '未初期化'
        });
        
        // UI統合テスト
        tests.push({
            name: 'UI統合',
            success: typeof window.csvAdminManager !== 'undefined',
            details: window.csvAdminManager ? 'AdminManager検出' : 'AdminManager未検出'
        });
        
        // 結果サマリー
        const successCount = tests.filter(t => t.success).length;
        const successRate = Math.round((successCount / tests.length) * 100);
        
        console.log('\n統合テスト結果:');
        tests.forEach(test => {
            console.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.details}`);
        });
        
        console.log(`\n成功率: ${successRate}% (${successCount}/${tests.length})`);
        
        return {
            tests,
            successRate,
            message: successRate === 100 ? '統合成功' : '統合に問題があります'
        };
    }

    /**
     * 全データ保存（サーバー送信シミュレーション）
     */
    async saveAllData() {
        try {
            // バックアップ作成
            await this.backupManager.createBackup('all');
            
            // 保存処理（実際はサーバーAPIを呼び出す）
            console.log('データ保存シミュレーション:');
            
            if (window.csvAdminManager && window.csvAdminManager.uploadedFiles) {
                for (const [type, fileData] of window.csvAdminManager.uploadedFiles) {
                    console.log(`- ${type}: ${fileData.rowCount}件のデータ`);
                }
            }
            
            // 成功メッセージ
            if (window.csvAdminManager && window.csvAdminManager.showSuccess) {
                window.csvAdminManager.showSuccess('すべてのデータが正常に保存されました。');
            }
            
            return true;
            
        } catch (error) {
            console.error('データ保存エラー:', error);
            if (window.csvAdminManager && window.csvAdminManager.showError) {
                window.csvAdminManager.showError(`保存エラー: ${error.message}`);
            }
            return false;
        }
    }

    /**
     * エラーリカバリ機能
     */
    async recoverFromError() {
        try {
            console.log('エラーリカバリ実行中...');
            
            // 最新のバックアップから復元
            await this.backupManager.rollback();
            
            console.log('エラーリカバリ完了');
            return true;
            
        } catch (error) {
            console.error('エラーリカバリ失敗:', error);
            return false;
        }
    }

    /**
     * データ型ごとのパーサー設定取得
     */
    getParserConfigForType(dataType) {
        const configs = {
            regions: {
                requiredFields: ['parameter_no', 'region'],
                fieldTypes: {
                    parameter_no: 'integer',
                    region: 'string'
                },
                errorRecovery: true
            },
            clinics: {
                requiredFields: ['id', 'name', 'code'],
                fieldTypes: {
                    id: 'integer',
                    name: 'string',
                    code: 'string'
                },
                errorRecovery: true
            },
            stores: {
                requiredFields: ['id', 'name', 'clinicName', 'address'],
                fieldTypes: {
                    id: 'integer',
                    name: 'string',
                    clinicName: 'string',
                    address: 'string',
                    zipcode: 'string',
                    region_id: 'integer'
                },
                errorRecovery: true
            },
            rankings: {
                requiredFields: ['region_id', 'no1'],
                fieldTypes: {
                    region_id: 'integer',
                    no1: 'integer',
                    no2: 'integer',
                    no3: 'integer'
                },
                errorRecovery: true
            },
            store_views: {
                requiredFields: ['store_id', 'region_id', 'visibility'],
                fieldTypes: {
                    store_id: 'integer',
                    region_id: 'integer',
                    visibility: 'integer'
                },
                errorRecovery: true
            }
        };
        
        return configs[dataType] || { errorRecovery: true };
    }

    /**
     * セキュリティ監査レポート生成
     */
    generateSecurityAudit() {
        if (!this.securityLayer) {
            return {
                status: 'セキュリティレイヤー未初期化',
                available: false
            };
        }
        
        const report = this.securityLayer.generateSecurityReport();
        const validations = this.securityLayer.validateSecuritySettings();
        
        return {
            status: '監査完了',
            available: true,
            report: report,
            validations: validations,
            recommendations: [
                ...report.recommendations,
                ...this.getAdditionalRecommendations()
            ]
        };
    }

    /**
     * 追加のセキュリティ推奨事項
     */
    getAdditionalRecommendations() {
        const recommendations = [];
        
        // ファイルサイズチェック
        if (window.csvAdminManager && window.csvAdminManager.uploadedFiles) {
            let totalSize = 0;
            for (const [type, data] of window.csvAdminManager.uploadedFiles) {
                totalSize += data.file.size;
            }
            
            if (totalSize > 50 * 1024 * 1024) {
                recommendations.push({
                    severity: 'info',
                    message: `合計ファイルサイズが大きくなっています（${(totalSize / (1024 * 1024)).toFixed(2)}MB）。パフォーマンスに影響する可能性があります。`
                });
            }
        }
        
        // セキュリティヘッダーチェック
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            recommendations.push({
                severity: 'medium',
                message: 'Content Security Policyが設定されていません。XSS攻撃のリスクがあります。'
            });
        }
        
        return recommendations;
    }

    /**
     * ステータス取得
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            csvManager: this.csvManager !== null,
            backupManager: this.backupManager !== null,
            securityLayer: this.securityLayer !== null,
            csvParserAdvanced: this.csvParserAdvanced !== null,
            filesUploaded: window.csvAdminManager ? window.csvAdminManager.uploadedFiles.size : 0,
            backupCount: this.backupManager ? this.backupManager.getBackupList().length : 0,
            securityStatus: this.securityLayer ? 'Active' : 'Inactive'
        };
    }
}

// グローバルに公開
window.IntegrationAdapter = IntegrationAdapter;

// 自動初期化
document.addEventListener('DOMContentLoaded', async () => {
    // Papa Parseが読み込まれるまで待機
    const waitForPapa = setInterval(() => {
        if (typeof Papa !== 'undefined') {
            clearInterval(waitForPapa);
            
            // 統合アダプター初期化
            window.integrationAdapter = new IntegrationAdapter();
            window.integrationAdapter.init().then(() => {
                console.log('統合アダプター準備完了');
                
                // 統合テスト実行
                window.integrationAdapter.runIntegrationTest();
            });
        }
    }, 100);
});