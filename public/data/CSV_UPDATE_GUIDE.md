# CSV更新ガイド

## 概要
このガイドでは、CSVファイルを更新した後にWebサイトに反映させる手順を説明します。

## クイックスタート（最も簡単な方法）

CSVファイルを編集した後、以下のコマンドを実行するだけです：

```bash
cd public/data/
make update
```

これで全ての処理（JSONへの変換、全環境へのコピー）が自動的に完了します！

## CSVファイル一覧

| ファイル名 | 説明 | 主な用途 |
|-----------|------|---------|
| `出しわけSS - ranking.csv` | 地域別ランキング情報 | 各地域でのクリニック順位設定 |
| `出しわけSS - items.csv` | クリニック基本情報 | クリニック名、ID、基本データ |
| `出しわけSS - stores.csv` | 店舗情報 | 各クリニックの店舗詳細（住所、電話番号など） |
| `出しわけSS - region.csv` | 地域マスタ | 地域ID、地域名の定義 |
| `出しわけSS - store_view.csv` | 地域別店舗表示設定 | どの地域にどの店舗を表示するか |
| `出しわけSS - campaigns.csv` | キャンペーン情報 | 各クリニックのキャンペーン内容 |

## 更新手順（詳細版）

### 方法1: 自動化コマンドを使用（推奨）

#### Makefileを使用
```bash
cd public/data/

# CSVをJSONに変換して全環境に配布
make update

# その他のコマンド
make convert   # CSVをJSONに変換のみ
make copy      # 既存のJSONを全環境にコピーのみ
make help      # ヘルプを表示
```

#### シェルスクリプトを使用
```bash
cd public/data/
./update-all-data.sh
```

### 方法2: 手動で実行

#### 1. CSVファイルの編集
```bash
# public/data/ディレクトリ内のCSVファイルを編集
cd public/data/
# 例: ランキングを更新する場合
# "出しわけSS - ranking.csv" を編集
```

#### 2. JSONファイルへの変換
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

#### 3. 各環境へのコピー
生成されたJSONファイルを各環境にコピーします：

```bash
# 一括コピー（推奨）
cp public/data/compiled-data.json public/draft/data/compiled-data.json
cp public/data/compiled-data.json public/draft002/data/compiled-data.json
cp public/data/compiled-data.json public/medical-diet001/data/compiled-data.json
cp public/data/compiled-data.json public/medical-diet002/data/compiled-data.json
cp public/data/compiled-data.json public/cryolipolysis/data/compiled-data.json
cp public/data/compiled-data.json public/injection-lipolysis001/data/compiled-data.json
cp public/data/compiled-data.json public/potenza001/data/compiled-data.json
```

### 4. 動作確認
```bash
# ローカルサーバーを起動
python3 -m http.server 8090

# ブラウザで確認
# http://localhost:8090/draft/
# http://localhost:8090/medical-diet001/
# など

# キャッシュをクリアして確認（重要！）
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

## よくある更新ケース

### ケース1: ランキングの変更
```bash
# 1. CSVを編集
# "出しわけSS - ranking.csv" を開いて編集
# parameter_no: 地域ID（例: 026は京都）
# no1〜no5: クリニックID（1〜5の数字、または "-" で非表示）

# 2. 自動更新コマンドを実行
cd public/data/
make update
```

### ケース2: 新しいクリニックの追加
```bash
# 1. クリニック基本情報を追加
# "出しわけSS - items.csv" に新しい行を追加

# 2. 店舗情報を追加
# "出しわけSS - stores.csv" に店舗情報を追加

# 3. 必要に応じて地域別表示設定
# "出しわけSS - store_view.csv" を編集

# 4. 自動更新コマンドを実行
cd public/data/
make update
```

### ケース3: 店舗の表示/非表示を切り替え
```bash
# 1. store_view.csvを編集
# "出しわけSS - store_view.csv" を開いて編集
# 表示したい店舗のclinic_idとstore_idを設定

# 2. 自動更新コマンドを実行
cd public/data/
make update
```

### ケース4: キャンペーン情報の更新
```bash
# 1. キャンペーンCSVを編集
# "出しわけSS - campaigns.csv" を開いて編集

# 2. 自動更新コマンドを実行
cd public/data/
make update
```

## CSVファイルの詳細仕様

### ranking.csv
| カラム名 | 説明 | 例 |
|---------|------|-----|
| parameter_no | 地域ID（3桁） | 013 |
| no1 | 1位のクリニックID | 1 |
| no2 | 2位のクリニックID | 2 |
| no3 | 3位のクリニックID | 3 |
| no4 | 4位のクリニックID | 4 |
| no5 | 5位のクリニックID | 5 |

### items.csv
| カラム名 | 説明 | 例 |
|---------|------|-----|
| clinic_id | クリニックID | 1 |
| clinic_name | クリニック名 | ディオクリニック |

### stores.csv
| カラム名 | 説明 | 例 |
|---------|------|-----|
| clinic_id | クリニックID | 1 |
| store_id | 店舗ID | 1 |
| store_name | 店舗名 | 銀座有楽町院 |
| address | 住所 | 東京都中央区銀座... |
| tel | 電話番号 | 03-1234-5678 |
| hours | 営業時間 | 10:00〜19:00 |

### store_view.csv
| カラム名 | 説明 | 例 |
|---------|------|-----|
| region_id | 地域ID | 013 |
| clinic_id | クリニックID | 1 |
| store_id | 店舗ID（カンマ区切り） | 1,2,3 |

## 配布先ディレクトリ一覧
- `public/draft/data/` - メインのドラフト環境
- `public/draft002/data/` - ドラフト環境2
- `public/medical-diet001/data/` - 医療ダイエット1
- `public/medical-diet002/data/` - 医療ダイエット2
- `public/cryolipolysis/data/` - 脂肪冷却
- `public/injection-lipolysis001/data/` - 脂肪溶解注射
- `public/potenza001/data/` - ポテンツァ

## 注意事項
- CSVファイルの文字コードは必ずUTF-8を使用
- カンマ区切りで保存（タブ区切りは使用しない）
- ヘッダー行は絶対に変更しない
- 空白セルは "-" または空文字列で表現
- 日本語を含む場合は、Excelで開く際に文字化けに注意

## トラブルシューティング

### Q: 変換エラーが発生する
A: CSVファイルの形式を確認してください。特に：
- 文字コードがUTF-8になっているか
- カンマ区切りになっているか
- ヘッダー行が正しいか

### Q: ブラウザで変更が反映されない
A: ブラウザのキャッシュをクリアしてください：
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R

### Q: 特定の環境だけに反映したい
A: 個別にコピーすることも可能です：
```bash
# 例: draftだけに反映
cp compiled-data.json ../draft/data/
```

### Q: CSVに特殊文字（カンマ、改行）を含めたい
A: ダブルクォートで囲んでください：
```
"東京都中央区銀座1-2-3, ABCビル5F"
```

## サポート
問題が解決しない場合は、以下を確認してください：
1. Node.jsがインストールされているか（`node -v`で確認）
2. 必要なファイルがすべて存在するか
3. 権限エラーが出ていないか