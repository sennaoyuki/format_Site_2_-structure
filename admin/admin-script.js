// CSV管理画面のJavaScript

class CSVAdminManager {
    constructor() {
        this.uploadedFiles = new Map();
        this.fileTypes = ['region', 'items', 'ranking', 'stores', 'store_view'];
        this.backups = [];
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateStats();
        this.loadBackups();
        this.startRealtimeUpdates();
    }

    setupEventListeners() {
        // ドラッグ&ドロップとファイル選択のイベント設定
        this.fileTypes.forEach(type => {
            const dropzone = document.getElementById(`${type}-dropzone`);
            const input = document.getElementById(`${type}-input`);

            // ドラッグ&ドロップイベント
            dropzone.addEventListener('dragover', this.handleDragOver.bind(this));
            dropzone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            dropzone.addEventListener('drop', (e) => this.handleDrop(e, type));
            
            // クリックでファイル選択
            dropzone.addEventListener('click', () => input.click());
            
            // ファイル選択イベント
            input.addEventListener('change', (e) => this.handleFileSelect(e, type));
            
            // 削除ボタンイベント
            const deleteBtn = document.getElementById(`${type}-delete`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteFile(type));
            }
        });

        // プレビュー関連
        document.getElementById('preview-select').addEventListener('change', this.handlePreviewSelect.bind(this));
        document.getElementById('clear-preview').addEventListener('click', this.clearPreview.bind(this));

        // 一括操作ボタン
        document.getElementById('clear-all').addEventListener('click', this.clearAll.bind(this));
        document.getElementById('validate-all').addEventListener('click', this.validateAll.bind(this));
        document.getElementById('save-all').addEventListener('click', this.saveAll.bind(this));
        document.getElementById('save-settings').addEventListener('click', this.saveSettings.bind(this));
        
        // バックアップ関連
        document.getElementById('create-backup').addEventListener('click', this.createBackup.bind(this));
        document.getElementById('restore-backup').addEventListener('click', this.restoreBackup.bind(this));

        // メッセージクローズボタン
        document.getElementById('close-error').addEventListener('click', this.hideError.bind(this));
        document.getElementById('close-success').addEventListener('click', this.hideSuccess.bind(this));
    }

    // ドラッグオーバー処理
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    // ドラッグリーブ処理
    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    // ドロップ処理
    handleDrop(e, type) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0], type);
        }
    }

    // ファイル選択処理
    handleFileSelect(e, type) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0], type);
        }
    }

    // ファイル処理
    processFile(file, type) {
        // CSVファイルかチェック
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('CSVファイルを選択してください。');
            return;
        }

        // ファイルサイズチェック（10MB制限）
        if (file.size > 10 * 1024 * 1024) {
            this.showError('ファイルサイズが大きすぎます（10MB以下にしてください）。');
            return;
        }

        this.uploadFile(file, type);
    }

    // ファイルアップロード処理
    async uploadFile(file, type) {
        const statusEl = document.getElementById(`${type}-status`);
        const progressEl = document.getElementById(`${type}-progress`);
        const progressFill = progressEl.querySelector('.progress-fill');
        const progressText = progressEl.querySelector('.progress-text');
        const infoEl = document.getElementById(`${type}-info`);
        const card = document.querySelector(`[data-file-type="${type}"]`);

        // UI更新
        statusEl.textContent = 'アップロード中';
        statusEl.className = 'upload-status uploading';
        progressEl.style.display = 'block';
        card.classList.remove('uploaded', 'error');

        try {
            // ファイル読み込み
            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);

            // プログレスバー更新（シミュレーション）
            for (let i = 0; i <= 100; i += 10) {
                progressFill.style.width = i + '%';
                progressText.textContent = i + '%';
                await this.sleep(50);
            }

            // データ保存
            this.uploadedFiles.set(type, {
                file: file,
                data: data,
                uploadedAt: new Date()
            });

            // UI更新
            statusEl.textContent = '完了';
            statusEl.className = 'upload-status completed';
            card.classList.add('uploaded');
            
            // 削除ボタン表示
            const deleteBtn = document.getElementById(`${type}-delete`);
            if (deleteBtn) {
                deleteBtn.style.display = 'inline-block';
            }
            
            // ファイル情報表示
            infoEl.innerHTML = `
                <strong>ファイル名:</strong> ${file.name}<br>
                <strong>サイズ:</strong> ${this.formatFileSize(file.size)}<br>
                <strong>レコード数:</strong> ${data.length - 1}行<br>
                <strong>アップロード時刻:</strong> ${new Date().toLocaleString()}
            `;
            infoEl.classList.add('show');

            // プレビューオプション追加
            this.updatePreviewOptions();
            this.updateStats();
            
            this.showSuccess(`${file.name} のアップロードが完了しました。`);

        } catch (error) {
            console.error('Upload error:', error);
            statusEl.textContent = 'エラー';
            statusEl.className = 'upload-status error';
            card.classList.add('error');
            this.showError(`アップロードエラー: ${error.message}`);
        } finally {
            // プログレスバー非表示
            setTimeout(() => {
                progressEl.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
            }, 1000);
        }
    }

    // ファイルをテキストとして読み込み
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    // CSV解析
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        return lines.map(line => {
            // 簡単なCSV解析（カンマ区切り）
            return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        });
    }

    // スリープ関数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ファイルサイズフォーマット
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // プレビューオプション更新
    updatePreviewOptions() {
        const select = document.getElementById('preview-select');
        
        // 既存オプションをクリア（最初のオプション以外）
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // アップロード済みファイルのオプション追加
        this.uploadedFiles.forEach((fileData, type) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${this.getFileDisplayName(type)} (${fileData.data.length - 1}行)`;
            select.appendChild(option);
        });

        // プレビューセクション表示
        if (this.uploadedFiles.size > 0) {
            document.getElementById('preview-section').style.display = 'block';
        }
    }

    // ファイル表示名取得
    getFileDisplayName(type) {
        const names = {
            region: '地域データ',
            items: 'クリニックデータ',
            ranking: 'ランキングデータ',
            stores: '店舗データ',
            store_view: '店舗ビューデータ'
        };
        return names[type] || type;
    }

    // プレビュー選択処理
    handlePreviewSelect(e) {
        const type = e.target.value;
        if (!type || !this.uploadedFiles.has(type)) {
            this.clearPreview();
            return;
        }

        const fileData = this.uploadedFiles.get(type);
        this.showPreview(type, fileData);
    }

    // プレビュー表示
    showPreview(type, fileData) {
        const data = fileData.data;
        const filename = fileData.file.name;
        const records = data.length - 1;

        // プレビュー情報更新
        document.getElementById('preview-filename').textContent = filename;
        document.getElementById('preview-records').textContent = `${records} レコード`;

        // テーブルヘッダー作成
        const thead = document.getElementById('preview-thead');
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        data[0].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // テーブルボディ作成（最初の10行のみ表示）
        const tbody = document.getElementById('preview-tbody');
        tbody.innerHTML = '';
        const displayRows = Math.min(10, data.length - 1);
        
        for (let i = 1; i <= displayRows; i++) {
            const row = document.createElement('tr');
            data[i].forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        }

        // 10行を超える場合の表示
        if (records > 10) {
            const row = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = data[0].length;
            td.style.textAlign = 'center';
            td.style.fontStyle = 'italic';
            td.style.color = '#666';
            td.textContent = `... 他 ${records - 10} 行`;
            row.appendChild(td);
            tbody.appendChild(row);
        }
    }

    // プレビュークリア
    clearPreview() {
        document.getElementById('preview-select').value = '';
        document.getElementById('preview-filename').textContent = '';
        document.getElementById('preview-records').textContent = '';
        document.getElementById('preview-thead').innerHTML = '';
        document.getElementById('preview-tbody').innerHTML = '';
    }

    // 統計更新
    updateStats() {
        const uploadedCount = this.uploadedFiles.size;
        const totalRecords = Array.from(this.uploadedFiles.values())
            .reduce((sum, fileData) => sum + (fileData.data.length - 1), 0);

        document.getElementById('uploaded-count').textContent = uploadedCount;
        document.getElementById('total-records').textContent = totalRecords.toLocaleString();
        
        // 最終更新時刻
        const lastUpdate = document.getElementById('last-update');
        if (uploadedCount > 0) {
            const now = new Date();
            lastUpdate.textContent = now.toLocaleTimeString('ja-JP');
        } else {
            lastUpdate.textContent = '-';
        }
    }

    // 全てクリア
    clearAll() {
        if (!confirm('全てのアップロードファイルをクリアしますか？')) {
            return;
        }

        this.uploadedFiles.clear();
        
        // UI リセット
        this.fileTypes.forEach(type => {
            const statusEl = document.getElementById(`${type}-status`);
            const infoEl = document.getElementById(`${type}-info`);
            const card = document.querySelector(`[data-file-type="${type}"]`);
            const input = document.getElementById(`${type}-input`);

            statusEl.textContent = '待機中';
            statusEl.className = 'upload-status waiting';
            infoEl.classList.remove('show');
            card.classList.remove('uploaded', 'error');
            input.value = '';
        });

        this.clearPreview();
        document.getElementById('preview-section').style.display = 'none';
        this.updateStats();
        
        this.showSuccess('全てのファイルをクリアしました。');
    }

    // データ検証
    validateAll() {
        if (this.uploadedFiles.size === 0) {
            this.showError('検証するファイルがありません。');
            return;
        }

        const errors = [];
        const warnings = [];

        // 必須ファイルチェック
        const requiredFiles = ['region', 'items', 'ranking', 'stores', 'store_view'];
        requiredFiles.forEach(type => {
            if (!this.uploadedFiles.has(type)) {
                errors.push(`${this.getFileDisplayName(type)}が不足しています。`);
            }
        });

        // データ整合性チェック（簡易版）
        if (this.uploadedFiles.has('region') && this.uploadedFiles.has('ranking')) {
            const regionData = this.uploadedFiles.get('region').data;
            const rankingData = this.uploadedFiles.get('ranking').data;
            
            // 地域データとランキングデータの整合性をチェック
            const regionIds = regionData.slice(1).map(row => row[0]);
            const rankingRegionIds = rankingData.slice(1).map(row => row[0]);
            
            rankingRegionIds.forEach(id => {
                if (!regionIds.includes(id)) {
                    warnings.push(`ランキングデータに存在する地域ID「${id}」が地域データに見つかりません。`);
                }
            });
        }

        // 結果表示
        if (errors.length > 0) {
            this.showError(`検証エラー:\n${errors.join('\n')}`);
        } else if (warnings.length > 0) {
            this.showError(`検証警告:\n${warnings.join('\n')}`);
        } else {
            this.showSuccess('データ検証が完了しました。問題は見つかりませんでした。');
        }
    }

    // 保存処理（模擬）
    saveAll() {
        if (this.uploadedFiles.size === 0) {
            this.showError('保存するファイルがありません。');
            return;
        }

        // 実際の実装では、ここでサーバーにデータを送信
        this.showSuccess(`${this.uploadedFiles.size}個のファイルを保存しました。`);
    }

    // エラーメッセージ表示
    showError(message) {
        const errorEl = document.getElementById('error-message');
        const textEl = document.getElementById('error-text');
        textEl.textContent = message;
        errorEl.style.display = 'block';
        
        // 5秒後に自動的に非表示
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    // 成功メッセージ表示
    showSuccess(message) {
        const successEl = document.getElementById('success-message');
        const textEl = document.getElementById('success-text');
        textEl.textContent = message;
        successEl.style.display = 'block';
        
        // 3秒後に自動的に非表示
        setTimeout(() => {
            this.hideSuccess();
        }, 3000);
    }

    // エラーメッセージ非表示
    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    // 成功メッセージ非表示
    hideSuccess() {
        document.getElementById('success-message').style.display = 'none';
    }

    // ファイル削除
    deleteFile(type) {
        if (!confirm(`${this.getFileDisplayName(type)}を削除しますか？`)) {
            return;
        }

        this.uploadedFiles.delete(type);
        
        // UI リセット
        const statusEl = document.getElementById(`${type}-status`);
        const infoEl = document.getElementById(`${type}-info`);
        const card = document.querySelector(`[data-file-type="${type}"]`);
        const input = document.getElementById(`${type}-input`);
        const deleteBtn = document.getElementById(`${type}-delete`);

        statusEl.textContent = '待機中';
        statusEl.className = 'upload-status waiting';
        infoEl.classList.remove('show');
        card.classList.remove('uploaded', 'error');
        input.value = '';
        deleteBtn.style.display = 'none';

        this.updateStats();
        this.updatePreviewOptions();
        
        this.showSuccess(`${this.getFileDisplayName(type)}を削除しました。`);
    }

    // キーボードショートカット設定
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveAll();
            }
            
            // Ctrl/Cmd + D: データ検証
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.validateAll();
            }
            
            // Ctrl/Cmd + B: バックアップ作成
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.createBackup();
            }
            
            // ESC: メッセージを閉じる
            if (e.key === 'Escape') {
                this.hideError();
                this.hideSuccess();
            }
        });
    }

    // リアルタイム更新開始
    startRealtimeUpdates() {
        // 30秒ごとに統計を更新
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }

    // 設定の保存
    saveSettings() {
        const settings = {
            autoBackup: true,
            backupInterval: 3600000, // 1時間
            maxBackups: 10,
            theme: 'light',
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('csvAdminSettings', JSON.stringify(settings));
        this.settings = settings;
        
        this.showSuccess('設定を保存しました。');
    }

    // 設定の読み込み
    loadSettings() {
        const saved = localStorage.getItem('csvAdminSettings');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // デフォルト設定
        return {
            autoBackup: true,
            backupInterval: 3600000,
            maxBackups: 10,
            theme: 'light'
        };
    }

    // バックアップ作成
    createBackup() {
        if (this.uploadedFiles.size === 0) {
            this.showError('バックアップするファイルがありません。');
            return;
        }

        const backup = {
            id: Date.now(),
            date: new Date().toISOString(),
            files: Array.from(this.uploadedFiles.entries()).map(([type, data]) => ({
                type: type,
                fileName: data.file.name,
                recordCount: data.data.length - 1
            })),
            data: Array.from(this.uploadedFiles.entries())
        };

        this.backups.push(backup);
        
        // 最大バックアップ数を超えたら古いものを削除
        if (this.backups.length > this.settings.maxBackups) {
            this.backups.shift();
        }
        
        this.saveBackups();
        this.updateBackupList();
        
        this.showSuccess('バックアップを作成しました。');
    }

    // バックアップ復元
    restoreBackup() {
        const select = document.getElementById('backup-select');
        const backupId = parseInt(select.value);
        
        if (!backupId) {
            this.showError('復元するバックアップを選択してください。');
            return;
        }

        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) {
            this.showError('バックアップが見つかりません。');
            return;
        }

        if (!confirm('現在のデータを破棄して、バックアップから復元しますか？')) {
            return;
        }

        // データ復元
        this.uploadedFiles.clear();
        backup.data.forEach(([type, data]) => {
            this.uploadedFiles.set(type, data);
        });

        // UI更新
        this.fileTypes.forEach(type => {
            if (this.uploadedFiles.has(type)) {
                const statusEl = document.getElementById(`${type}-status`);
                const card = document.querySelector(`[data-file-type="${type}"]`);
                const deleteBtn = document.getElementById(`${type}-delete`);
                
                statusEl.textContent = '完了';
                statusEl.className = 'upload-status completed';
                card.classList.add('uploaded');
                deleteBtn.style.display = 'inline-block';
            }
        });

        this.updateStats();
        this.updatePreviewOptions();
        
        this.showSuccess('バックアップから復元しました。');
    }

    // バックアップリスト更新
    updateBackupList() {
        const listEl = document.getElementById('backup-list');
        const selectEl = document.getElementById('backup-select');
        
        if (this.backups.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">バックアップがありません</p>';
            selectEl.style.display = 'none';
            return;
        }

        // リスト表示
        listEl.innerHTML = this.backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-date">${new Date(backup.date).toLocaleString('ja-JP')}</div>
                    <div class="backup-details">
                        ファイル数: ${backup.files.length} / 
                        総レコード: ${backup.files.reduce((sum, f) => sum + f.recordCount, 0)}
                    </div>
                </div>
                <div class="backup-actions">
                    <button class="backup-restore" onclick="csvAdmin.restoreBackupById(${backup.id})">復元</button>
                    <button class="backup-delete" onclick="csvAdmin.deleteBackup(${backup.id})">削除</button>
                </div>
            </div>
        `).join('');

        // セレクトボックス更新
        selectEl.innerHTML = '<option value="">バックアップを選択...</option>';
        this.backups.forEach(backup => {
            const option = document.createElement('option');
            option.value = backup.id;
            option.textContent = new Date(backup.date).toLocaleString('ja-JP');
            selectEl.appendChild(option);
        });
        selectEl.style.display = 'block';
    }

    // バックアップ保存
    saveBackups() {
        localStorage.setItem('csvAdminBackups', JSON.stringify(this.backups));
    }

    // バックアップ読み込み
    loadBackups() {
        const saved = localStorage.getItem('csvAdminBackups');
        if (saved) {
            this.backups = JSON.parse(saved);
            this.updateBackupList();
        }
    }

    // バックアップ削除
    deleteBackup(id) {
        if (!confirm('このバックアップを削除しますか？')) {
            return;
        }

        this.backups = this.backups.filter(b => b.id !== id);
        this.saveBackups();
        this.updateBackupList();
        
        this.showSuccess('バックアップを削除しました。');
    }

    // IDによるバックアップ復元
    restoreBackupById(id) {
        document.getElementById('backup-select').value = id;
        this.restoreBackup();
    }
}

// グローバル変数として公開（バックアップ操作用）
let csvAdmin;

// ページ読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    csvAdmin = new CSVAdminManager();
});