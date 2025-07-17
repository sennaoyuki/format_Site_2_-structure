/**
 * バックアップ機能
 * CSVファイルの自動バックアップ、復元、ロールバック機能
 */

class BackupManager {
    constructor() {
        this.backupPath = '../public/data/backups/';
        this.maxBackups = 10; // 最大バックアップ数
        this.dataPath = '../public/data/';
        this.csvFiles = {
            regions: '出しわけSS - region.csv',
            clinics: '出しわけSS - items.csv',
            stores: '出しわけSS - stores.csv',
            rankings: '出しわけSS - ranking.csv',
            store_views: '出しわけSS - store_view.csv'
        };
    }

    /**
     * バックアップディレクトリの初期化
     */
    async initBackupDirectory() {
        try {
            // バックアップディレクトリの存在確認（クライアントサイドでは制限あり）
            console.log('バックアップディレクトリを初期化中...');
            return true;
        } catch (error) {
            console.error('バックアップディレクトリ初期化エラー:', error);
            return false;
        }
    }

    /**
     * 現在のデータをバックアップ
     */
    async createBackup(dataType = 'all') {
        try {
            const timestamp = this.generateTimestamp();
            const backupInfo = {
                timestamp,
                dataType,
                files: [],
                success: false
            };

            if (dataType === 'all') {
                // 全データのバックアップ
                for (const [type, filename] of Object.entries(this.csvFiles)) {
                    const result = await this.backupSingleFile(type, filename, timestamp);
                    backupInfo.files.push(result);
                }
            } else {
                // 特定のデータのみバックアップ
                const filename = this.csvFiles[dataType];
                if (filename) {
                    const result = await this.backupSingleFile(dataType, filename, timestamp);
                    backupInfo.files.push(result);
                }
            }

            // バックアップ情報をローカルストレージに保存
            this.saveBackupInfo(backupInfo);

            // 古いバックアップのクリーンアップ
            await this.cleanupOldBackups();

            backupInfo.success = true;
            console.log('バックアップ完了:', backupInfo);
            return backupInfo;

        } catch (error) {
            console.error('バックアップエラー:', error);
            throw new Error(`バックアップ作成に失敗しました: ${error.message}`);
        }
    }

    /**
     * 単一ファイルのバックアップ
     */
    async backupSingleFile(dataType, filename, timestamp) {
        try {
            // 現在のファイルを読み込み
            const response = await fetch(this.dataPath + filename);
            if (!response.ok) {
                throw new Error(`ファイルの読み込みに失敗: ${filename}`);
            }

            const content = await response.text();
            
            // バックアップファイル名を生成
            const backupFilename = `${timestamp}_${dataType}_${filename}`;
            
            // ローカルストレージにバックアップ内容を保存
            const backupKey = `backup_${backupFilename}`;
            localStorage.setItem(backupKey, content);

            // ブラウザダウンロードとしてバックアップファイルを保存
            this.downloadBackup(content, backupFilename);

            return {
                dataType,
                originalFile: filename,
                backupFile: backupFilename,
                size: content.length,
                success: true
            };

        } catch (error) {
            console.error(`ファイルバックアップエラー (${filename}):`, error);
            return {
                dataType,
                originalFile: filename,
                error: error.message,
                success: false
            };
        }
    }

    /**
     * ファイルダウンロード機能
     */
    downloadBackup(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * バックアップからの復元
     */
    async restoreFromBackup(backupId) {
        try {
            const backupInfo = this.getBackupInfo(backupId);
            if (!backupInfo) {
                throw new Error('指定されたバックアップが見つかりません');
            }

            const restoreResults = [];

            for (const fileInfo of backupInfo.files) {
                if (fileInfo.success) {
                    const backupKey = `backup_${fileInfo.backupFile}`;
                    const content = localStorage.getItem(backupKey);
                    
                    if (content) {
                        // 復元前に現在のデータをバックアップ
                        await this.createBackup(fileInfo.dataType);
                        
                        // データを復元（実際の実装では、サーバーAPIを呼び出す）
                        const result = await this.writeFileContent(fileInfo.originalFile, content);
                        restoreResults.push({
                            file: fileInfo.originalFile,
                            success: result.success,
                            error: result.error
                        });
                    }
                }
            }

            console.log('復元完了:', restoreResults);
            return restoreResults;

        } catch (error) {
            console.error('復元エラー:', error);
            throw new Error(`データ復元に失敗しました: ${error.message}`);
        }
    }

    /**
     * ファイル内容の書き込み（サーバーサイド処理が必要）
     */
    async writeFileContent(filename, content) {
        try {
            // TODO: 実際の実装では、サーバーAPIにPOSTリクエストを送信
            console.log(`ファイル復元シミュレーション: ${filename}`);
            
            // 模擬的な成功レスポンス
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: true });
                }, 500);
            });

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * エラー時のロールバック
     */
    async rollback() {
        try {
            const backups = this.getBackupList();
            if (backups.length === 0) {
                throw new Error('ロールバック可能なバックアップがありません');
            }

            // 最新のバックアップを取得
            const latestBackup = backups[0];
            
            console.log('ロールバック実行中...', latestBackup);
            
            const result = await this.restoreFromBackup(latestBackup.id);
            
            console.log('ロールバック完了');
            return result;

        } catch (error) {
            console.error('ロールバックエラー:', error);
            throw new Error(`ロールバックに失敗しました: ${error.message}`);
        }
    }

    /**
     * バックアップ情報の保存
     */
    saveBackupInfo(backupInfo) {
        const backups = this.getBackupList();
        
        backupInfo.id = this.generateBackupId();
        backups.unshift(backupInfo);
        
        // 最大数を超えた場合は古いものを削除
        if (backups.length > this.maxBackups) {
            const removedBackups = backups.splice(this.maxBackups);
            // 削除されたバックアップのローカルストレージも削除
            removedBackups.forEach(backup => {
                backup.files.forEach(file => {
                    if (file.success) {
                        localStorage.removeItem(`backup_${file.backupFile}`);
                    }
                });
            });
        }
        
        localStorage.setItem('backup_list', JSON.stringify(backups));
    }

    /**
     * バックアップリストの取得
     */
    getBackupList() {
        const stored = localStorage.getItem('backup_list');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * 特定のバックアップ情報を取得
     */
    getBackupInfo(backupId) {
        const backups = this.getBackupList();
        return backups.find(backup => backup.id === backupId);
    }

    /**
     * 古いバックアップのクリーンアップ
     */
    async cleanupOldBackups() {
        try {
            const backups = this.getBackupList();
            
            // 最大数を超えたバックアップを削除
            if (backups.length > this.maxBackups) {
                const toRemove = backups.slice(this.maxBackups);
                
                toRemove.forEach(backup => {
                    backup.files.forEach(file => {
                        if (file.success) {
                            localStorage.removeItem(`backup_${file.backupFile}`);
                        }
                    });
                });
                
                // リストを更新
                const updatedBackups = backups.slice(0, this.maxBackups);
                localStorage.setItem('backup_list', JSON.stringify(updatedBackups));
                
                console.log(`${toRemove.length} 個の古いバックアップを削除しました`);
            }

        } catch (error) {
            console.error('バックアップクリーンアップエラー:', error);
        }
    }

    /**
     * バックアップの削除
     */
    deleteBackup(backupId) {
        try {
            const backups = this.getBackupList();
            const backupIndex = backups.findIndex(backup => backup.id === backupId);
            
            if (backupIndex === -1) {
                throw new Error('指定されたバックアップが見つかりません');
            }
            
            const backup = backups[backupIndex];
            
            // ローカルストレージからファイルを削除
            backup.files.forEach(file => {
                if (file.success) {
                    localStorage.removeItem(`backup_${file.backupFile}`);
                }
            });
            
            // リストから削除
            backups.splice(backupIndex, 1);
            localStorage.setItem('backup_list', JSON.stringify(backups));
            
            console.log('バックアップを削除しました:', backupId);
            return true;

        } catch (error) {
            console.error('バックアップ削除エラー:', error);
            return false;
        }
    }

    /**
     * バックアップのエクスポート
     */
    exportBackup(backupId) {
        try {
            const backup = this.getBackupInfo(backupId);
            if (!backup) {
                throw new Error('指定されたバックアップが見つかりません');
            }

            const exportData = {
                backupInfo: backup,
                files: {}
            };

            backup.files.forEach(file => {
                if (file.success) {
                    const backupKey = `backup_${file.backupFile}`;
                    const content = localStorage.getItem(backupKey);
                    if (content) {
                        exportData.files[file.backupFile] = content;
                    }
                }
            });

            const exportJson = JSON.stringify(exportData, null, 2);
            const exportFilename = `backup_export_${backup.timestamp}.json`;
            
            this.downloadBackup(exportJson, exportFilename);
            
            return true;

        } catch (error) {
            console.error('バックアップエクスポートエラー:', error);
            return false;
        }
    }

    /**
     * タイムスタンプ生成
     */
    generateTimestamp() {
        const now = new Date();
        return now.getFullYear() +
               String(now.getMonth() + 1).padStart(2, '0') +
               String(now.getDate()).padStart(2, '0') +
               '_' +
               String(now.getHours()).padStart(2, '0') +
               String(now.getMinutes()).padStart(2, '0') +
               String(now.getSeconds()).padStart(2, '0');
    }

    /**
     * バックアップID生成
     */
    generateBackupId() {
        return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * バックアップ統計情報の取得
     */
    getBackupStatistics() {
        const backups = this.getBackupList();
        
        let totalSize = 0;
        let successCount = 0;
        let failureCount = 0;

        backups.forEach(backup => {
            backup.files.forEach(file => {
                if (file.success) {
                    successCount++;
                    totalSize += file.size || 0;
                } else {
                    failureCount++;
                }
            });
        });

        return {
            totalBackups: backups.length,
            successfulFiles: successCount,
            failedFiles: failureCount,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(1),
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
            newestBackup: backups.length > 0 ? backups[0].timestamp : null
        };
    }
}

// グローバルエクスポート
window.BackupManager = BackupManager;