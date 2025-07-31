# URL一元管理ガイド

## 現状の問題点
現在、クリニックのURLが複数箇所にハードコーディングされており、変更時にすべての箇所を更新する必要があります。

## 提案する解決策

### 1. 設定ファイルの作成
`/public/draft/config/clinic-urls.js` に全クリニックのURLを一元管理

```javascript
const CLINIC_URLS = {
    dio: {
        name: 'ディオクリニック',
        baseUrl: 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=96845522dd28188c',
        defaultParams: {}
    },
    // 他のクリニックも同様
};
```

### 2. 各ファイルでの使用方法

#### A. HTMLファイル（index.html）で使用
```html
<!-- head内で設定ファイルを読み込み -->
<script src="/draft/config/clinic-urls.js"></script>

<!-- 使用箇所 -->
<script>
    // clinic-urls.jsから動的に取得
    const dioUrl = window.CLINIC_URLS.dio.baseUrl;
    document.getElementById('dio-official-link').textContent = dioUrl;
</script>
```

#### B. app.jsでの使用
```javascript
// ファイルの先頭で設定を読み込む（動的インポート）
async function loadClinicUrls() {
    const script = document.createElement('script');
    script.src = '/draft/config/clinic-urls.js';
    await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
    });
    return window.CLINIC_URLS;
}

// または、app.jsの初期化時に設定を取得
class RankingApp {
    async init() {
        // URL設定を読み込み
        this.clinicUrls = await loadClinicUrls();
        
        // 以降、this.clinicUrls.dio.baseUrl のように使用
    }
}
```

#### C. リダイレクトページでの使用
各`/go/[clinic]/index.html`で：
```html
<script src="/draft/config/clinic-urls.js"></script>
<script>
    const clinicId = 'dio'; // または'eminal'など
    const baseUrl = window.CLINIC_URLS[clinicId].baseUrl;
    // リダイレクト処理
</script>
```

### 3. 実装手順

1. **設定ファイルの作成** ✓
   - `/public/draft/config/clinic-urls.js`

2. **リダイレクトページの更新**
   - 各`/go/[clinic]/index.html`を更新
   - 設定ファイルを読み込み、URLを動的に取得

3. **app.jsの更新**
   - ハードコーディングされたURLを削除
   - 設定ファイルから動的に取得

4. **index.htmlの更新**
   - ハードコーディングされたURLを削除
   - JavaScriptで動的に設定

### 4. メリット

- **保守性向上**: URL変更時は`clinic-urls.js`のみ編集
- **一貫性**: すべての場所で同じURLを使用
- **拡張性**: 新しいクリニック追加も簡単
- **エラー削減**: 更新漏れがなくなる

### 5. 注意点

- キャッシュ対策: `clinic-urls.js?v=20250731`のようにバージョン管理
- 非同期読み込み: 設定ファイル読み込み完了を待つ必要あり
- フォールバック: 設定ファイル読み込みエラー時の対策

### 6. 段階的移行

1. まず`draft`ディレクトリで実装・テスト
2. 問題なければ`medical-diet001`、`medical-diet002`にも適用
3. 全ディレクトリで統一された管理体制を構築