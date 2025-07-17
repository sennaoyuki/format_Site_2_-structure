/**
 * ファイルアップロード処理
 * ドラッグ&ドロップ対応、プログレス表示、セキュリティ機能付き
 */

class FileUploader {
    constructor(options = {}) {
        this.options = {
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['.csv', 'text/csv', 'application/csv'],
            dropZoneId: 'dropZone',
            fileInputId: 'fileInput',
            progressBarId: 'progressBar',
            progressTextId: 'progressText',
            previewId: 'dataPreview',
            ...options
        };

        this.csvManager = new CSVManager();
        this.currentFile = null;
        this.currentData = null;
        this.currentDataType = null;

        this.initElements();
        this.bindEvents();
    }

    /**
     * DOM要素の初期化
     */
    initElements() {
        this.dropZone = document.getElementById(this.options.dropZoneId);
        this.fileInput = document.getElementById(this.options.fileInputId);
        this.progressBar = document.getElementById(this.options.progressBarId);
        this.progressText = document.getElementById(this.options.progressTextId);
        this.preview = document.getElementById(this.options.previewId);

        if (!this.dropZone || !this.fileInput) {
            console.error('必要なDOM要素が見つかりません');
            return;
        }

        this.setupDropZone();
    }

    /**
     * ドロップゾーンのセットアップ
     */
    setupDropZone() {
        this.dropZone.innerHTML = `
            <div class="drop-zone-content">
                <div class="drop-zone-icon">📁</div>
                <p class="drop-zone-text">CSVファイルをドラッグ&ドロップ</p>
                <p class="drop-zone-subtext">または <span class="browse-link">ファイルを選択</span></p>
                <div class="file-restrictions">
                    <small>対応形式: CSV / 最大サイズ: ${this.options.maxFileSize / (1024 * 1024)}MB</small>
                </div>
            </div>
        `;

        // ブラウズリンクのクリックイベント
        const browseLink = this.dropZone.querySelector('.browse-link');
        if (browseLink) {
            browseLink.addEventListener('click', () => {
                this.fileInput.click();
            });
        }
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        // ドラッグ&ドロップイベント
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

        // ファイル入力イベント
        this.fileInput.addEventListener('change', this.handleFileInput.bind(this), false);
    }

    /**
     * デフォルトイベントの防止
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * ドロップゾーンのハイライト
     */
    highlight() {
        this.dropZone.classList.add('drag-over');
    }

    /**
     * ドロップゾーンのハイライト解除
     */
    unhighlight() {
        this.dropZone.classList.remove('drag-over');
    }

    /**
     * ドロップイベントの処理
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.handleFiles([files[0]]); // 最初のファイルのみ処理
        }
    }

    /**
     * ファイル入力の処理
     */
    handleFileInput(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.handleFiles(files);
        }
    }

    /**
     * ファイル処理
     */
    async handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        this.currentFile = file;

        try {
            this.showProgress(0, 'ファイルを検証中...');

            // ファイルバリデーション
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            this.showProgress(25, 'ファイルを解析中...');

            // データタイプの選択を要求
            const dataType = await this.selectDataType();
            this.currentDataType = dataType;

            this.showProgress(50, 'CSVを解析中...');

            // CSVパース
            const result = await this.csvManager.parseCSV(file, dataType);
            this.currentData = result.data;

            this.showProgress(75, 'データを検証中...');

            // プレビュー表示
            this.showPreview(result.data);

            this.showProgress(100, '解析完了');

            // 成功通知
            this.showMessage('ファイルの解析が完了しました', 'success');

            // アップロードボタンを表示
            this.showUploadButton();

        } catch (error) {
            this.showError(error.message);
            this.hideProgress();
        }
    }

    /**
     * ファイルバリデーション
     */
    validateFile(file) {
        // ファイルサイズチェック
        if (file.size > this.options.maxFileSize) {
            return {
                isValid: false,
                error: `ファイルサイズが制限を超えています (最大: ${this.options.maxFileSize / (1024 * 1024)}MB)`
            };
        }

        // ファイル型チェック
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isValidType = this.options.allowedTypes.includes(fileExtension) || 
                          this.options.allowedTypes.includes(file.type);

        if (!isValidType) {
            return {
                isValid: false,
                error: 'CSVファイルのみアップロード可能です'
            };
        }

        return { isValid: true };
    }

    /**
     * データタイプ選択ダイアログ
     */
    selectDataType() {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.className = 'data-type-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>データタイプを選択してください</h3>
                    <div class="data-type-options">
                        <label><input type="radio" name="dataType" value="regions"> 地域データ</label>
                        <label><input type="radio" name="dataType" value="clinics"> クリニックデータ</label>
                        <label><input type="radio" name="dataType" value="stores"> 店舗データ</label>
                        <label><input type="radio" name="dataType" value="rankings"> ランキングデータ</label>
                        <label><input type="radio" name="dataType" value="store_views"> 店舗表示データ</label>
                    </div>
                    <div class="modal-buttons">
                        <button id="confirmType" disabled>確定</button>
                        <button id="cancelType">キャンセル</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // ラジオボタンの変更イベント
            const radios = modal.querySelectorAll('input[name="dataType"]');
            const confirmBtn = modal.querySelector('#confirmType');

            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    confirmBtn.disabled = false;
                });
            });

            // 確定ボタン
            confirmBtn.addEventListener('click', () => {
                const selected = modal.querySelector('input[name="dataType"]:checked');
                if (selected) {
                    document.body.removeChild(modal);
                    resolve(selected.value);
                }
            });

            // キャンセルボタン
            modal.querySelector('#cancelType').addEventListener('click', () => {
                document.body.removeChild(modal);
                reject(new Error('データタイプ選択がキャンセルされました'));
            });
        });
    }

    /**
     * プログレス表示
     */
    showProgress(percent, message = '') {
        if (this.progressBar) {
            this.progressBar.style.display = 'block';
            this.progressBar.style.width = `${percent}%`;
        }

        if (this.progressText) {
            this.progressText.textContent = message;
            this.progressText.style.display = 'block';
        }

        // プログレスバーのアニメーション
        if (percent === 100) {
            setTimeout(() => {
                this.hideProgress();
            }, 1000);
        }
    }

    /**
     * プログレス非表示
     */
    hideProgress() {
        if (this.progressBar) {
            this.progressBar.style.display = 'none';
        }
        if (this.progressText) {
            this.progressText.style.display = 'none';
        }
    }

    /**
     * データプレビュー表示
     */
    showPreview(data) {
        if (!this.preview) return;

        const preview = this.csvManager.generatePreview(data, 10);
        const stats = this.csvManager.getDataStatistics(data);

        this.preview.innerHTML = `
            <div class="preview-header">
                <h3>データプレビュー</h3>
                <div class="data-stats">
                    <span>行数: ${stats.totalRows}</span>
                    <span>列数: ${stats.columnCount}</span>
                    <span>サイズ: ${(stats.memoryUsage / 1024).toFixed(1)}KB</span>
                </div>
            </div>
            <div class="preview-table-container">
                <table class="preview-table">
                    <thead>
                        <tr>
                            ${preview.headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${preview.rows.map(row => `
                            <tr>
                                ${preview.headers.map(header => `<td>${this.escapeHtml(row[header] || '')}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${preview.hasMore ? `<p class="preview-more">他 ${stats.totalRows - preview.rows.length} 行...</p>` : ''}
            </div>
        `;

        this.preview.style.display = 'block';
    }

    /**
     * アップロードボタン表示
     */
    showUploadButton() {
        const existingButton = document.getElementById('uploadConfirm');
        if (existingButton) {
            existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'uploadConfirm';
        button.className = 'upload-confirm-btn';
        button.textContent = 'データを更新';
        button.addEventListener('click', this.confirmUpload.bind(this));

        if (this.preview) {
            this.preview.appendChild(button);
        }
    }

    /**
     * アップロード確認
     */
    async confirmUpload() {
        if (!this.currentData || !this.currentDataType) {
            this.showError('アップロードするデータがありません');
            return;
        }

        try {
            // バックアップマネージャーの呼び出し
            if (window.BackupManager) {
                const backupManager = new BackupManager();
                await backupManager.createBackup(this.currentDataType);
            }

            // データの保存処理（実装は要カスタマイズ）
            await this.saveData(this.currentData, this.currentDataType);

            this.showMessage('データが正常に更新されました', 'success');
            this.reset();

        } catch (error) {
            this.showError(`データ更新に失敗しました: ${error.message}`);
        }
    }

    /**
     * データ保存（カスタマイズ要）
     */
    async saveData(data, dataType) {
        // TODO: 実際のデータ保存処理を実装
        // サーバーサイドAPIへの送信など
        console.log('データ保存:', { dataType, records: data.length });
        
        // 模擬的な非同期処理
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `upload-message ${type}`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 5000);
    }

    /**
     * エラー表示
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * リセット
     */
    reset() {
        this.currentFile = null;
        this.currentData = null;
        this.currentDataType = null;
        
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        
        if (this.preview) {
            this.preview.style.display = 'none';
        }

        this.setupDropZone();
        this.hideProgress();

        const uploadButton = document.getElementById('uploadConfirm');
        if (uploadButton) {
            uploadButton.remove();
        }
    }
}

// グローバルエクスポート
window.FileUploader = FileUploader;