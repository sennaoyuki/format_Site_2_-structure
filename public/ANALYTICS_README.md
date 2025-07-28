# Analytics設定ガイド

このサイトではGoogle Analytics (GA4)とMicrosoft Clarityを使用してアクセス解析を行います。

## 設定方法

### 1. IDの取得

#### Google Analytics (GA4)
1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 管理 → データストリーム → ウェブストリームを選択
3. 測定ID（G-で始まるID）をコピー

#### Microsoft Clarity
1. [Microsoft Clarity](https://clarity.microsoft.com/)にアクセス
2. プロジェクトを選択 → Settings → Setup
3. Project IDをコピー

### 2. analytics.jsの設定

`public/analytics.js`ファイルを開き、以下の部分を編集：

```javascript
// Google Analytics測定ID（GA4）
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // ← ここにGA4の測定IDを入力

// Microsoft Clarity Project ID
const CLARITY_PROJECT_ID = 'XXXXXXXXXX'; // ← ここにClarityのProject IDを入力
```

### 3. 本番環境設定（オプション）

開発環境では動作させたくない場合：

```javascript
// 本番環境でのみ動作させる場合は true に設定
const PRODUCTION_ONLY = true; // ← true に変更
```

## HTMLファイルへの追加方法

新しいHTMLファイルを作成する場合は、`</head>`タグの直前に以下を追加：

```html
<!-- Analytics -->
<script src="/analytics.js"></script>
```

または相対パスで：

```html
<!-- Analytics -->
<script src="../analytics.js"></script>
```

## カスタムイベントの送信

JavaScriptから任意のイベントを送信できます：

```javascript
// 例：ボタンクリックをトラッキング
trackEvent('button_click', {
    button_name: 'cta_button',
    page_name: 'home'
});

// 例：フォーム送信をトラッキング
trackEvent('form_submit', {
    form_name: 'contact_form',
    form_location: 'footer'
});
```

## 確認方法

### Google Analytics
1. リアルタイムレポートでアクセスが記録されているか確認
2. デバッグビュー（DebugView）で詳細なイベントを確認

### Microsoft Clarity
1. ダッシュボードでセッションが記録されているか確認
2. レコーディングでユーザー行動を確認

## トラブルシューティング

### コンソールでの確認
ブラウザの開発者ツールのコンソールで以下のメッセージを確認：

- 正常に読み込まれた場合：
  - `Analytics: Google Analytics loaded`
  - `Analytics: Microsoft Clarity loaded`

- IDが未設定の場合：
  - `Analytics: Google Analytics ID not configured`
  - `Analytics: Microsoft Clarity ID not configured`

### 広告ブロッカー
広告ブロッカーを使用している場合、アナリティクスがブロックされる可能性があります。
テスト時は一時的に無効化してください。

## プライバシーポリシーへの記載

アナリティクスツールを使用する場合は、プライバシーポリシーに以下を記載してください：

- Google Analyticsの使用について
- Microsoft Clarityの使用について
- クッキーの使用について
- データの収集目的
- オプトアウトの方法

## 注意事項

- 個人情報（メールアドレス、名前など）をアナリティクスに送信しないでください
- GDPRやCCPAなどのプライバシー規制に準拠してください
- 必要に応じてクッキー同意バナーを実装してください