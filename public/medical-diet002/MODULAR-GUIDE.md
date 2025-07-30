# モジュラーセクションシステム ガイド

## 概要
medical-diet002では、各セクション（ヘッダー、ヒーロー、ランキングなど）を独立したモジュールとして管理し、デザインを簡単に切り替えられるシステムを実装しています。

## 使用方法

### 基本的な使い方
モジュラー版のページにアクセス：
```
/medical-diet002/index-modular.html
```

### デザイン切り替え方法

#### 1. URLパラメータで指定
特定のセクションのデザインを変更：
```
/medical-diet002/index-modular.html?header_design=design2
/medical-diet002/index-modular.html?header_design=design2&hero_design=design2
```

#### 2. デバッグモードで切り替え
```
/medical-diet002/index-modular.html?debug=1
```
画面右下にコントロールパネルが表示され、デザインを切り替えられます。

#### 3. JavaScriptで動的に切り替え
```javascript
// 特定のセクションのデザインを変更
switchSectionDesign('header', 'design2');

// 全セクションのデザインを一括変更
switchAllDesigns('design2');
```

### iframeモード
SEO対策が不要な場合や、完全に独立したセクションが必要な場合：
```
/medical-diet002/index-modular.html?loader=iframe
```

## ディレクトリ構造
```
medical-diet002/
├── sections/
│   ├── header/
│   │   ├── design1/
│   │   │   └── index.html
│   │   └── design2/
│   │       └── index.html
│   ├── hero/
│   │   ├── design1/
│   │   │   └── index.html
│   │   └── design2/
│   │       └── index.html
│   └── ... (他のセクション)
├── section-loader.js
├── index-modular.html
└── index.html (従来版)
```

## 新しいデザインの追加方法

### 1. ディレクトリを作成
```bash
mkdir -p public/medical-diet002/sections/header/design3
```

### 2. HTMLファイルを作成
`public/medical-diet002/sections/header/design3/index.html`:
```html
<!-- ヘッダーセクション Design 3 -->
<header class="site-header site-header-design3">
    <!-- デザイン3のコンテンツ -->
</header>

<style>
/* Design 3 専用スタイル */
.site-header-design3 {
    /* スタイル定義 */
}
</style>

<script>
// Design 3 専用のJavaScript
</script>
```

### 3. 使用
```
/medical-diet002/index-modular.html?header_design=design3
```

## 注意事項

### パフォーマンス
- 各セクションは非同期で読み込まれます
- 初回読み込み時は少し時間がかかる場合があります
- ブラウザのキャッシュが効くため、2回目以降は高速です

### SEO
- 通常モード（fetch）：SEOフレンドリー
- iframeモード：SEOには不向き（検索エンジンがコンテンツを認識しにくい）

### スタイルの競合
- 各セクションのスタイルは独立して定義してください
- グローバルなスタイルは`styles.css`で管理します
- セクション固有のスタイルは各セクションのHTML内に記述します

## メリット
1. **A/Bテスト**: 異なるデザインを簡単に比較
2. **メンテナンス性**: セクションごとに独立して管理
3. **再利用性**: 他のプロジェクトでもセクションを使い回し可能
4. **開発効率**: チームで並行してセクション開発が可能

## トラブルシューティング

### セクションが読み込まれない
- ブラウザのコンソールでエラーを確認
- ファイルパスが正しいか確認
- ネットワークタブで404エラーがないか確認

### スタイルが適用されない
- セクション内の`<style>`タグを確認
- 親要素のCSSが影響していないか確認
- ブラウザの開発者ツールで要素を検査

### JavaScriptが動作しない
- セクションローダーの`executeScripts`メソッドが呼ばれているか確認
- スクリプトエラーがないかコンソールを確認
- DOMが完全に読み込まれてから実行されているか確認