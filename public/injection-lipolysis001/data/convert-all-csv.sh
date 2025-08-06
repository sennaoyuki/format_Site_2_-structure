#!/bin/bash

# CSVからJSONへの変換スクリプト
# 使い方: ./convert-all-csv.sh

echo "🔄 CSV → JSON 変換を開始します..."
echo ""

# 現在のディレクトリを保存
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 1. 共通テキストの変換
if [ -f "site-common-texts.csv" ]; then
    echo "📄 共通テキストを変換中..."
    node convert-common-texts-to-json.js
    echo ""
fi

# 2. クリニックテキストの変換
if [ -f "clinic-texts.csv" ]; then
    echo "🏥 クリニックテキストを変換中..."
    node convert-clinic-texts-to-json.js
    echo ""
fi

# 3. その他のCSVファイルの変換
if [ -f "convert-csv-to-json.js" ]; then
    echo "📊 その他のデータを変換中..."
    node convert-csv-to-json.js
    echo ""
fi

# 4. サイトテキストの変換（もし存在すれば）
if [ -f "site-texts.csv" ] && [ -f "convert-site-texts-to-json.js" ]; then
    echo "🌐 サイトテキストを変換中..."
    node convert-site-texts-to-json.js
    echo ""
fi

echo "✅ すべての変換が完了しました！"
echo ""
echo "変換されたファイル:"
ls -la *.json | grep -v package.json