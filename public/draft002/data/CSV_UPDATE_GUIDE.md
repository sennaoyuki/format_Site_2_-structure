# CSV更新ガイド

## 概要
このガイドでは、CSVファイルを更新した後にWebサイトに反映させる手順を説明します。

## CSVファイル一覧
- `出しわけSS - ranking.csv` - 地域別ランキング情報
- `出しわけSS - items.csv` - クリニック基本情報
- `出しわけSS - stores.csv` - 店舗情報
- `出しわけSS - region.csv` - 地域マスタ
- `出しわけSS - store_view.csv` - 地域別店舗表示設定
- `出しわけSS - campaigns.csv` - キャンペーン情報

## 更新手順

### 1. CSVファイルの編集
```bash
# public/data/ディレクトリ内のCSVファイルを編集
cd public/data/
# 例: ランキングを更新する場合
# "出しわけSS - ranking.csv" を編集
```

### 2. JSONファイルへの変換
CSVファイルを編集した後、必ず以下のコマンドを実行してJSONファイルを更新します：

```bash
# dataディレクトリ内で実行
cd public/data/
node convert-csv-to-json.js
```

このコマンドは以下の処理を行います：
- すべてのCSVファイルを読み込み
- データを統合・構造化
- `public/data/compiled-data.json` を生成

### 3. draftディレクトリへのコピー
生成されたJSONファイルをdraftディレクトリにもコピーします：

```bash
cp public/data/compiled-data.json public/draft/data/compiled-data.json
```

### 4. 他の環境への反映（必要に応じて）
```bash
# medical-diet001への反映
cp public/data/compiled-data.json public/medical-diet001/data/compiled-data.json

# medical-diet002への反映
cp public/data/compiled-data.json public/medical-diet002/data/compiled-data.json
```

### 5. 動作確認
```bash
# ローカルサーバーを起動
python3 -m http.server 8090

# ブラウザで確認
# http://localhost:8090/draft/
```

## よくある更新ケース

### ランキングの変更
1. `出しわけSS - ranking.csv` を編集
   - parameter_no: 地域ID（例: 026は京都）
   - no1〜no5: クリニックID（1〜5の数字、または "-" で非表示）

2. 変換コマンドを実行
```bash
node convert-csv-to-json.js
cp public/data/compiled-data.json public/draft/data/compiled-data.json
```

### 新しいクリニックの追加
1. `出しわけSS - items.csv` に新しい行を追加
2. 必要に応じて `出しわけSS - stores.csv` に店舗情報を追加
3. 変換コマンドを実行

## 注意事項
- CSVファイルの文字コードはUTF-8を使用
- カンマ区切りで保存（タブ区切りは使用しない）
- ヘッダー行は変更しない
- 空白セルは "-" または空文字列で表現

## トラブルシューティング
- 変換エラーが発生した場合は、CSVファイルの形式を確認
- 特殊文字（カンマ、改行など）が含まれる場合は適切にエスケープ
- ブラウザでキャッシュが残っている場合は、強制リロード（Ctrl+Shift+R）を実行