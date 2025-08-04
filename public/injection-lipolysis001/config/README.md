# クリニックURL一元管理

## 概要
`clinic-urls.js` ファイルでクリニックの遷移先URLを一元管理しています。

## 使用方法

### URLを変更する場合
1. `clinic-urls.js` を開く
2. 該当クリニックの `baseUrl` を編集
3. 保存するだけで全ページに反映されます

例:
```javascript
dio: {
    name: 'ディオクリニック',
    baseUrl: '新しいURL',  // ← ここを変更
    defaultParams: {}
},
```

### 対応ファイル
以下のファイルがこの設定を使用しています:
- `index.html` - メインページ
- `app.js` - 動的コンテンツ生成
- `go/dio/index.html` - DIOリダイレクトページ
- `go/eminal/index.html` - エミナルリダイレクトページ

### 注意事項
- URLを変更した場合、ブラウザのキャッシュをクリアする必要があります
- 開発時はDevToolsでキャッシュを無効化することを推奨