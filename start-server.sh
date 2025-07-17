#!/bin/bash

# クリニックランキングサイト起動スクリプト

echo "🏥 クリニックランキングサイトを起動します..."

# Pythonがインストールされているか確認
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3がインストールされていません"
    exit 1
fi

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# publicディレクトリの存在確認
if [ ! -d "public" ]; then
    echo "❌ publicディレクトリが見つかりません"
    exit 1
fi

# CSVファイルの存在確認
if [ ! -d "public/data" ]; then
    echo "⚠️  データディレクトリが見つかりません"
    echo "CSVファイルをコピーしています..."
    mkdir -p public/data
    cp "/Users/hattaryoga/Desktop/kiro_サイト出し分け/data2/"*.csv public/data/ 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ CSVファイルをコピーしました"
    else
        echo "❌ CSVファイルのコピーに失敗しました"
    fi
fi

# サーバー起動
echo ""
echo "📊 利用可能なCSVファイル:"
ls -la public/data/*.csv 2>/dev/null | awk '{print "   - " $9}'
echo ""

python3 start-server.py