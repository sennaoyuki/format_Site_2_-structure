# デプロイ手順書

バージョン: v1.1.0
最終更新: 2025-07-17

## 1. 事前準備

### 1.1 動作環境要件
- Webサーバー（Apache/Nginx/IIS等）
- 静的ファイルホスティング対応
- HTTPS対応（推奨）
- 最新ブラウザ対応

### 1.2 必要なファイル確認
```
release-v1.1.0/
├── src/
│   ├── index.html
│   ├── app.js
│   ├── data-manager.js
│   ├── styles.css
│   └── data/
│       ├── 出しわけSS - items.csv
│       ├── 出しわけSS - ranking.csv
│       ├── 出しわけSS - region.csv
│       ├── 出しわけSS - stores.csv
│       └── 出しわけSS - store_view.csv
├── docs/
├── CHANGELOG.md
└── DEPLOY.md（本ファイル）
```

## 2. デプロイ手順

### 2.1 バックアップ
```bash
# 現在の本番環境をバックアップ
cd /path/to/production
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz ./*
```

### 2.2 ファイルのアップロード
```bash
# リリースファイルを本番環境にコピー
rsync -av --delete release-v1.1.0/src/* /path/to/production/

# または、FTP/SFTP経由でアップロード
# release-v1.1.0/src/内の全ファイルを本番ディレクトリにアップロード
```

### 2.3 パーミッション設定
```bash
# ファイルの読み取り権限を設定
find /path/to/production -type f -exec chmod 644 {} \;
find /path/to/production -type d -exec chmod 755 {} \;
```

### 2.4 Webサーバー設定

#### Apache設定例
```apache
<Directory "/path/to/production">
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all granted
    
    # CSVファイルのMIMEタイプ設定
    <FilesMatch "\.csv$">
        Header set Content-Type "text/csv; charset=utf-8"
    </FilesMatch>
</Directory>
```

#### Nginx設定例
```nginx
location / {
    root /path/to/production;
    index index.html;
    
    # CSVファイルのMIMEタイプ設定
    location ~ \.csv$ {
        add_header Content-Type "text/csv; charset=utf-8";
    }
}
```

### 2.5 キャッシュクリア
```bash
# ブラウザキャッシュ対策
# index.htmlに以下のメタタグが含まれていることを確認
# <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">

# CDNを使用している場合はCDNキャッシュもクリア
```

## 3. 動作確認

### 3.1 基本動作確認
- [ ] トップページが正常に表示される
- [ ] 地域選択ドロップダウンが動作する
- [ ] 東京（013）を選択して表示確認
- [ ] データなし地域（鳥取等）で「該当店舗なし」表示

### 3.2 詳細確認チェックリスト
- [ ] 全64地域の表示確認（サンプリング可）
- [ ] JavaScriptコンソールにエラーがない
- [ ] レスポンシブデザインの確認（モバイル/タブレット）
- [ ] ページ読み込み速度（3秒以内）

### 3.3 アクセシビリティ確認
- [ ] aria-live属性が機能している
- [ ] キーボード操作が可能
- [ ] コントラスト比が適切

## 4. ロールバック手順

### 4.1 即時ロールバック（問題発生時）
```bash
# バックアップから復元
cd /path/to/production
rm -rf ./*
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz
```

### 4.2 部分的ロールバック
```bash
# 特定ファイルのみ戻す場合
cp /path/to/backup/app.js /path/to/production/app.js
cp /path/to/backup/index.html /path/to/production/index.html
```

## 5. トラブルシューティング

### 5.1 よくある問題と対処法

#### CSVファイルが読み込めない
- 原因：MIMEタイプ設定、文字コード、パス設定
- 対処：
  ```bash
  # ファイルの存在確認
  ls -la /path/to/production/data/*.csv
  
  # 文字コード確認
  file -i /path/to/production/data/*.csv
  ```

#### 「該当店舗なし」が表示されない
- 原因：app.jsのキャッシュ
- 対処：
  ```bash
  # ファイルのタイムスタンプ更新
  touch /path/to/production/app.js
  
  # またはファイル名にバージョン付与
  mv app.js app.js?v=1.1.0
  ```

#### パフォーマンスが遅い
- 原因：サーバー設定、ネットワーク
- 対処：
  - gzip圧縮を有効化
  - 静的ファイルのキャッシュ設定
  - CDN導入検討

### 5.2 緊急連絡先
- 技術責任者：[担当者名]
- 緊急対応：[電話番号]
- メール：[メールアドレス]

## 6. デプロイ後の監視

### 6.1 監視項目
- サーバーエラーログ
- アクセスログ
- JavaScriptエラー（Google Analytics等）
- ページ読み込み時間

### 6.2 成功基準
- エラー率：0.1%以下
- ページ読み込み：3秒以内
- 可用性：99.9%以上

## 7. 注意事項

1. **本番環境でのテスト**
   - 必ず本番URLでの動作確認を実施
   - 複数のブラウザ/デバイスでテスト

2. **段階的リリース**
   - 可能であれば、一部ユーザーから段階的に公開
   - A/Bテストの実施を検討

3. **バックアップ保持**
   - 最低1週間はバックアップを保持
   - 重要なリリースは1ヶ月保持推奨

---

## 変更履歴
- 2025-07-17: v1.1.0 初版作成