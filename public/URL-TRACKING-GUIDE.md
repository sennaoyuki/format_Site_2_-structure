# URLトラッキング機能ガイド

## 概要
このサイトでは、ユーザーのクリック行動を追跡するための共通URLトラッキング機能を実装しています。

## 使用方法

### 新しいページへの追加
新しいHTMLページを作成する際は、`</body>`タグの直前に以下のスクリプトタグを追加してください：

```html
<!-- URL Parameter Tracking -->
<script src="/url-tracking.js?v=2025072201" defer></script>
```

**重要**: 必ず絶対パス（`/url-tracking.js`）を使用してください。これにより、どのディレクトリからでも同じスクリプトを参照できます。

## 追跡されるパラメータ

### 基本パラメータ（全クリックで付与）
| パラメータ名 | 説明 | 値の例 |
|------------|------|--------|
| `click_section` | クリックが発生したセクション | `ranking`, `comparison_table`, `details` |
| `click_clinic` | クリックされたクリニック名 | `ディオクリニック`, `エミナルクリニック` |
| `source_page` | クリック元のページパス | `/`, `/medical-diet001/` |

### 内部ナビゲーションパラメータ
| パラメータ名 | 説明 | 発生タイミング |
|------------|------|--------------|
| `comparison_tab` | 選択された比較表タブ | 比較表タブ切り替え時 |
| `detail_click` | 詳細ボタンでクリックされたクリニック | 詳細を見るボタンクリック時 |
| `detail_rank` | クリニックの順位 | 詳細を見るボタンクリック時 |
| `tips_tab` | 選択されたTipsタブ | Tipsタブ切り替え時 |
| `tips_index` | Tipsタブのインデックス | Tipsタブ切り替え時 |
| `max_scroll` | 最大スクロール深度 | ページスクロール時（25%刻み） |

## 対応しているリンクタイプ

以下のいずれかの条件を満たすリンクが自動的に追跡されます：
- `link_btn`クラスを持つリンク
- URLに`/go/`を含むリンク
- `btn_second_primary`クラス内のリンク
- `cta-button`クラスを持つリンク

## セクション判別ロジック

スクリプトは以下の優先順位でセクションを判別します：
1. `.ranking-container`または`.ranking-item` → `ranking`
2. `.comparison-table` → `comparison_table`
3. `.clinic-details-container`または`.detail-item` → `details`
4. `.campaign-section` → `campaign_section`
5. `.map-modal` → `map_modal`

## メンテナンス

### バージョン管理
スクリプトを更新した場合は、キャッシュを回避するためにバージョン番号を更新してください：
```html
<script src="/url-tracking.js?v=2025072202" defer></script>
```

### デバッグ
ブラウザのコンソールで以下のメッセージを確認できます：
- `URL tracking initialized` - スクリプトの初期化完了
- `Outbound link tracking:` - 外部リンクのクリック詳細
- `Internal navigation tracked:` - 内部ナビゲーションの詳細

## 注意事項
- このスクリプトは`window.location`を使用してURLパラメータを管理します
- パラメータはURLエンコードされて送信されます
- 既存のパラメータは保持されます（region_idなど）