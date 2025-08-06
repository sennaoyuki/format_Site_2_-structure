# CSV → JSON 変換コマンド集

injection-lipolysis001のCSVファイルをJSONに変換するためのコマンド集です。

## 🚀 クイックスタート

### 1. すべてのCSVを一括変換
```bash
# Makefileを使う場合
make convert-all

# または、シェルスクリプトを直接実行
./convert-all-csv.sh
```

### 2. 特定のCSVだけを変換

#### 共通テキスト（site-common-texts.csv）
```bash
# Makefileを使う場合
make convert-common

# または、直接実行
node convert-common-texts-to-json.js
```

#### クリニックテキスト（clinic-texts.csv）
```bash
# Makefileを使う場合
make convert-clinic

# または、直接実行
node convert-clinic-texts-to-json.js
```

#### メインデータ（region.csv, items.csv など）
```bash
# Makefileを使う場合
make convert-main

# または、直接実行
node convert-csv-to-json.js
```

## 📝 decoタグの使い方

CSVファイル内で `<deco>テキスト</deco>` を使うと、そのテキストがピンク色（#fa7794）で表示されます。

例：
```
脂肪溶解注射で<deco>部分痩せの夢が現実に！</deco>
```

## 🔍 便利なコマンド

### 現在のファイル状況を確認
```bash
make check
```

### ヘルプを表示
```bash
make help
```

### JSONファイルを削除（注意！）
```bash
make clean
```

## 💡 Tips

1. CSVを編集した後は必ず変換コマンドを実行してください
2. `<deco>`タグは装飾したい部分だけに使いましょう
3. 変換後は必ずブラウザで表示を確認してください

## 🛠️ トラブルシューティング

### エラー: Permission denied
```bash
chmod +x convert-all-csv.sh
```

### エラー: node: command not found
Node.jsがインストールされていません。Node.jsをインストールしてください。

### CSVの文字化け
CSVファイルはUTF-8で保存してください。