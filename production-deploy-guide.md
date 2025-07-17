# 本番デプロイ手順書

作成者: Worker3
作成日時: 2025-07-17 12:30
対象システム: 地域別クリニックランキングサイト + CSV管理画面
バージョン: v1.1.0

## システム構成

### フロントエンド（地域別ランキングサイト）
- **URL**: https://your-domain.com/
- **ファイル構成**: HTML, CSS, JavaScript（静的ファイル）
- **データソース**: CSVファイル

### 管理画面（CSV管理システム）
- **URL**: https://your-domain.com/admin/
- **ファイル構成**: HTML, CSS, JavaScript + サーバーサイド処理
- **機能**: CSVファイルアップロード、バックアップ、データ検証

## 事前準備

### 1. サーバー要件
- [ ] Webサーバー（Apache 2.4+ / Nginx 1.18+ 推奨）
- [ ] Python 3.8+（管理画面用）
- [ ] HTTPS証明書（Let's Encrypt等）
- [ ] 十分なディスク容量（最低1GB推奨）

### 2. ファイル構成確認
```
production/
├── public/                      # フロントエンド
│   ├── index.html              # メインページ
│   ├── app.js                  # アプリケーションロジック
│   ├── data-manager.js         # データ管理
│   ├── styles.css              # スタイルシート
│   └── data/                   # CSVデータ
│       ├── 出しわけSS - items.csv
│       ├── 出しわけSS - ranking.csv
│       ├── 出しわけSS - region.csv
│       ├── 出しわけSS - stores.csv
│       └── 出しわけSS - store_view.csv
├── admin/                       # 管理画面
│   ├── index.html              # 管理画面トップ
│   ├── admin-script.js         # メインスクリプト
│   ├── admin-style.css         # 管理画面スタイル
│   ├── csv-manager.js          # CSV処理
│   ├── file-uploader.js        # アップロード処理
│   ├── backup-manager.js       # バックアップ管理
│   └── [Worker2実装ファイル]   # サーバーサイド処理
└── docs/                        # ドキュメント
```

### 3. セキュリティチェックリスト
- [ ] ファイルパーミッション設定確認
- [ ] 不要なファイルの削除（.gitファイル等）
- [ ] デバッグモードの無効化
- [ ] エラーメッセージの本番設定

## デプロイ手順

### ステップ1: 現在の本番環境バックアップ
```bash
# バックアップディレクトリ作成
mkdir -p /backup/clinic-ranking/$(date +%Y%m%d)

# 現在の本番環境をバックアップ
cd /var/www/html
tar -czf /backup/clinic-ranking/$(date +%Y%m%d)/backup-$(date +%H%M%S).tar.gz .

# データベース/CSVファイルのバックアップ
cp -r data /backup/clinic-ranking/$(date +%Y%m%d)/data-backup
```

### ステップ2: ファイルのアップロード
```bash
# 一時ディレクトリに展開
cd /tmp
tar -xzf release-v1.1.0.tar.gz

# フロントエンドファイル配置
rsync -av --delete /tmp/release-v1.1.0/public/ /var/www/html/

# 管理画面ファイル配置
rsync -av --delete /tmp/release-v1.1.0/admin/ /var/www/html/admin/

# CSVデータファイル配置（既存データを保持する場合はスキップ）
# rsync -av /tmp/release-v1.1.0/public/data/ /var/www/html/data/
```

### ステップ3: パーミッション設定
```bash
# ディレクトリ権限
find /var/www/html -type d -exec chmod 755 {} \;

# ファイル権限
find /var/www/html -type f -exec chmod 644 {} \;

# データディレクトリの書き込み権限（管理画面用）
chmod 775 /var/www/html/data
chown -R www-data:www-data /var/www/html/data
```

### ステップ4: Webサーバー設定

#### Apache設定例（/etc/apache2/sites-available/clinic-ranking.conf）
```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    # SSL設定
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # セキュリティヘッダー
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    
    # CSVファイルのMIMEタイプ
    <FilesMatch "\.csv$">
        Header set Content-Type "text/csv; charset=utf-8"
    </FilesMatch>
    
    # 管理画面アクセス制限（必要に応じて）
    <Directory "/var/www/html/admin">
        # Basic認証やIP制限を設定
    </Directory>
    
    # キャッシュ設定
    <FilesMatch "\.(js|css)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</VirtualHost>
```

#### Nginx設定例（/etc/nginx/sites-available/clinic-ranking）
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/html;
    
    # SSL設定
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # セキュリティヘッダー
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CSVファイル設定
    location ~ \.csv$ {
        add_header Content-Type "text/csv; charset=utf-8";
    }
    
    # 管理画面用Python処理（Worker2実装後）
    location /admin/api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 静的ファイルキャッシュ
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### ステップ5: サーバー再起動
```bash
# Apache
sudo systemctl reload apache2

# Nginx
sudo systemctl reload nginx

# 管理画面サーバー起動（Worker2実装後）
# cd /var/www/html/admin
# python3 server.py &
```

## 動作確認チェックリスト

### 基本動作確認
- [ ] フロントエンドトップページ表示
- [ ] 地域選択機能の動作
- [ ] ランキング表示の確認
- [ ] 店舗一覧表示の確認
- [ ] レスポンシブデザインの確認

### 管理画面確認
- [ ] 管理画面アクセス（認証確認）
- [ ] CSVファイルアップロード機能
- [ ] バックアップ機能
- [ ] データ検証機能
- [ ] エラーハンドリング

### パフォーマンス確認
- [ ] ページ読み込み速度（3秒以内）
- [ ] HTTPS接続の確認
- [ ] キャッシュの動作確認

## ロールバック手順

### 即時ロールバック（重大な問題発生時）
```bash
# 現在のファイルを退避
mv /var/www/html /var/www/html.failed

# バックアップから復元
cd /backup/clinic-ranking/[日付]
tar -xzf backup-[時刻].tar.gz -C /var/www/html

# Webサーバー再起動
sudo systemctl restart apache2  # または nginx
```

### 部分的ロールバック
```bash
# 特定ファイルのみ戻す
cp /backup/clinic-ranking/[日付]/[ファイル名] /var/www/html/[パス]
```

## 監視・メンテナンス

### 監視項目
- [ ] アクセスログ監視（/var/log/apache2/access.log）
- [ ] エラーログ監視（/var/log/apache2/error.log）
- [ ] ディスク使用量（特にデータディレクトリ）
- [ ] SSL証明書の有効期限

### 定期メンテナンス
- **日次**: ログファイルの確認
- **週次**: バックアップの作成
- **月次**: パフォーマンス分析、セキュリティアップデート

## トラブルシューティング

### よくある問題と対策

#### 1. CSVファイルが読み込めない
```bash
# ファイル権限確認
ls -la /var/www/html/data/

# 文字コード確認
file -i /var/www/html/data/*.csv

# 解決策
chmod 644 /var/www/html/data/*.csv
```

#### 2. 管理画面にアクセスできない
```bash
# サーバープロセス確認
ps aux | grep python

# ポート確認
netstat -tlnp | grep 8000

# 解決策
cd /var/www/html/admin && python3 server.py &
```

#### 3. パフォーマンスが遅い
- gzip圧縮の有効化
- ブラウザキャッシュの設定確認
- CDN導入の検討

## セキュリティ対策

### 本番環境での追加対策
1. **ファイアウォール設定**
   ```bash
   # 管理画面ポートの制限
   ufw allow from [管理者IP] to any port 8000
   ```

2. **定期的なセキュリティスキャン**
   ```bash
   # 脆弱性スキャン
   nikto -h https://your-domain.com
   ```

3. **バックアップの暗号化**
   ```bash
   # 暗号化バックアップ
   tar -czf - /var/www/html | openssl enc -aes-256-cbc -e > backup.tar.gz.enc
   ```

## 緊急連絡先
- **技術責任者**: [名前] - [電話番号]
- **サーバー管理者**: [名前] - [電話番号]
- **エスカレーション**: [上級管理者] - [電話番号]

## 更新履歴
- 2025-07-17: 初版作成（Worker3）
- [日付]: Worker2実装反映予定

## 注意事項
1. デプロイは必ず営業時間外に実施
2. 本番環境での直接編集は禁止
3. 全ての変更は必ずバックアップ後に実施
4. デプロイ後は必ず全機能の動作確認を実施