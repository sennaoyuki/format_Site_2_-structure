/**
 * 互換性テスト
 * 既存data-manager.jsとCSV処理システムの統合テスト
 */

class CompatibilityTest {
    constructor() {
        this.testResults = [];
        this.dataManager = null;
        this.csvManager = null;
        this.backupManager = null;
    }

    /**
     * 全テスト実行
     */
    async runAllTests() {
        console.log('=== 互換性テスト開始 ===');
        
        try {
            // 初期化テスト
            await this.testInitialization();
            
            // データ読み込みテスト
            await this.testDataLoading();
            
            // APIメソッドテスト
            await this.testAPIMethods();
            
            // CSV処理テスト
            await this.testCSVProcessing();
            
            // バックアップ機能テスト
            await this.testBackupFunctionality();
            
            // 結果サマリー
            this.printTestSummary();
            
        } catch (error) {
            console.error('テスト実行エラー:', error);
            this.addTestResult('テスト実行', false, error.message);
        }
        
        return this.testResults;
    }

    /**
     * 初期化テスト
     */
    async testInitialization() {
        console.log('--- 初期化テスト ---');
        
        try {
            // DataManager初期化
            this.dataManager = new DataManager();
            await this.dataManager.init();
            this.addTestResult('DataManager初期化', 
                this.dataManager.regions.length > 0, 
                `地域数: ${this.dataManager.regions.length}`);

            // CSVManager初期化
            this.csvManager = new CSVManager();
            this.addTestResult('CSVManager初期化', 
                this.csvManager.csvSchemas !== null, 
                'スキーマ定義確認');

            // BackupManager初期化
            this.backupManager = new BackupManager();
            this.addTestResult('BackupManager初期化', 
                this.backupManager.csvFiles !== null, 
                'ファイル定義確認');

        } catch (error) {
            this.addTestResult('初期化', false, error.message);
        }
    }

    /**
     * データ読み込みテスト
     */
    async testDataLoading() {
        console.log('--- データ読み込みテスト ---');
        
        try {
            // 地域データの確認
            const regions = this.dataManager.getAllRegions();
            this.addTestResult('地域データ読み込み', 
                Array.isArray(regions) && regions.length > 0, 
                `${regions.length}件の地域データ`);

            // クリニックデータの確認
            const clinics = this.dataManager.getAllClinics();
            this.addTestResult('クリニックデータ読み込み', 
                Array.isArray(clinics), 
                `${clinics.length}件のクリニックデータ`);

            // 特定地域のデータ確認
            const tokyoData = this.dataManager.getRegionById('013');
            this.addTestResult('特定地域データ取得', 
                tokyoData !== null, 
                `東京データ: ${tokyoData ? tokyoData.name : 'なし'}`);

        } catch (error) {
            this.addTestResult('データ読み込み', false, error.message);
        }
    }

    /**
     * APIメソッドテスト
     */
    async testAPIMethods() {
        console.log('--- APIメソッドテスト ---');
        
        try {
            // getAllRegions()テスト
            const regions = this.dataManager.getAllRegions();
            this.addTestResult('getAllRegions()', 
                Array.isArray(regions), 
                `戻り値型: ${typeof regions}, 長さ: ${regions.length}`);

            // getRegionById()テスト
            const region = this.dataManager.getRegionById('013');
            this.addTestResult('getRegionById()', 
                region && region.name, 
                `東京地域: ${region ? region.name : 'なし'}`);

            // getRankingByRegionId()テスト
            const ranking = this.dataManager.getRankingByRegionId('013');
            this.addTestResult('getRankingByRegionId()', 
                ranking !== null, 
                `東京ランキング: ${ranking ? 'あり' : 'なし'}`);

            // getStoresByRegionId()テスト
            const stores = this.dataManager.getStoresByRegionId('013');
            this.addTestResult('getStoresByRegionId()', 
                Array.isArray(stores), 
                `東京店舗数: ${stores ? stores.length : 0}`);

        } catch (error) {
            this.addTestResult('APIメソッド', false, error.message);
        }
    }

    /**
     * CSV処理テスト
     */
    async testCSVProcessing() {
        console.log('--- CSV処理テスト ---');
        
        try {
            // スキーマ定義テスト
            const schemas = this.csvManager.csvSchemas;
            this.addTestResult('CSVスキーマ定義', 
                schemas.regions && schemas.clinics && schemas.stores, 
                `定義済みスキーマ: ${Object.keys(schemas).length}種類`);

            // バリデーション機能テスト（サンプルデータ）
            const sampleData = [
                { parameter_no: '013', region: '東京' },
                { parameter_no: '027', region: '大阪' }
            ];
            
            const validation = this.csvManager.validateDataTypes(sampleData, 'regions');
            this.addTestResult('データ型バリデーション', 
                validation.isValid, 
                validation.error || 'バリデーション成功');

            // 重複チェックテスト
            const duplicateTest = this.csvManager.checkDuplicates(sampleData, 'regions');
            this.addTestResult('重複チェック', 
                duplicateTest.isValid, 
                duplicateTest.error || '重複なし');

        } catch (error) {
            this.addTestResult('CSV処理', false, error.message);
        }
    }

    /**
     * バックアップ機能テスト
     */
    async testBackupFunctionality() {
        console.log('--- バックアップ機能テスト ---');
        
        try {
            // ファイル定義確認
            const csvFiles = this.backupManager.csvFiles;
            this.addTestResult('バックアップファイル定義', 
                Object.keys(csvFiles).length === 5, 
                `定義ファイル数: ${Object.keys(csvFiles).length}`);

            // バックアップリスト取得
            const backupList = this.backupManager.getBackupList();
            this.addTestResult('バックアップリスト取得', 
                Array.isArray(backupList), 
                `既存バックアップ: ${backupList.length}件`);

            // バックアップ統計
            const stats = this.backupManager.getBackupStatistics();
            this.addTestResult('バックアップ統計', 
                typeof stats.totalBackups === 'number', 
                `総バックアップ: ${stats.totalBackups}件`);

        } catch (error) {
            this.addTestResult('バックアップ機能', false, error.message);
        }
    }

    /**
     * テスト結果追加
     */
    addTestResult(testName, success, details) {
        const result = {
            name: testName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅ 成功' : '❌ 失敗';
        console.log(`${status} - ${testName}: ${details}`);
    }

    /**
     * テスト結果サマリー
     */
    printTestSummary() {
        console.log('\n=== テスト結果サマリー ===');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        console.log(`総テスト数: ${totalTests}`);
        console.log(`成功: ${passedTests}`);
        console.log(`失敗: ${failedTests}`);
        console.log(`成功率: ${successRate}%`);
        
        if (failedTests > 0) {
            console.log('\n失敗したテスト:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`- ${result.name}: ${result.details}`);
            });
        }
        
        console.log('\n=== テスト完了 ===');
    }

    /**
     * HTMLレポート生成
     */
    generateHTMLReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        return `
            <div class="test-report">
                <h3>互換性テスト結果</h3>
                <div class="test-summary">
                    <div class="summary-item">
                        <span class="summary-label">総テスト数:</span>
                        <span class="summary-value">${totalTests}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">成功:</span>
                        <span class="summary-value success">${passedTests}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">失敗:</span>
                        <span class="summary-value error">${totalTests - passedTests}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">成功率:</span>
                        <span class="summary-value ${successRate >= 80 ? 'success' : 'warning'}">${successRate}%</span>
                    </div>
                </div>
                <div class="test-details">
                    ${this.testResults.map(result => `
                        <div class="test-result ${result.success ? 'success' : 'failure'}">
                            <div class="result-header">
                                <span class="result-icon">${result.success ? '✅' : '❌'}</span>
                                <span class="result-name">${result.name}</span>
                            </div>
                            <div class="result-details">${result.details}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 個別テスト実行
     */
    async runSingleTest(testName) {
        console.log(`=== 単体テスト: ${testName} ===`);
        
        switch (testName) {
            case 'initialization':
                await this.testInitialization();
                break;
            case 'dataLoading':
                await this.testDataLoading();
                break;
            case 'apiMethods':
                await this.testAPIMethods();
                break;
            case 'csvProcessing':
                await this.testCSVProcessing();
                break;
            case 'backup':
                await this.testBackupFunctionality();
                break;
            default:
                console.error('不明なテスト名:', testName);
        }
    }

    /**
     * 結果をJSONで取得
     */
    getResultsJSON() {
        return JSON.stringify(this.testResults, null, 2);
    }

    /**
     * 結果をCSVで取得
     */
    getResultsCSV() {
        const headers = ['テスト名', '結果', '詳細', 'タイムスタンプ'];
        const rows = this.testResults.map(result => [
            result.name,
            result.success ? '成功' : '失敗',
            result.details,
            result.timestamp
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// グローバルエクスポート
window.CompatibilityTest = CompatibilityTest;