#!/bin/bash

# CSV更新後の一括反映スクリプト
# 使い方: ./update-all-data.sh

echo "🚀 CSV → JSON変換と全環境への反映を開始..."
echo ""

# カレントディレクトリを保存
CURRENT_DIR=$(pwd)

# public/data ディレクトリに移動
cd "$(dirname "$0")" || exit 1

# JSONファイルへの変換
echo "📊 CSVファイルをJSONに変換中..."
node convert-csv-to-json.js

# 変換が成功したかチェック
if [ $? -ne 0 ]; then
    echo "❌ エラー: JSON変換に失敗しました"
    exit 1
fi

echo ""
echo "📁 各環境にファイルをコピー中..."

# 配布先ディレクトリのリスト
TARGETS=(
    "../draft/data"
    "../draft002/data"
    "../medical-diet001/data"
    "../medical-diet002/data"
    "../cryolipolysis/data"
    "../injection-lipolysis001/data"
    "../potenza001/data"
)

# 各ディレクトリにコピー
for target in "${TARGETS[@]}"; do
    if [ -d "$target" ]; then
        cp compiled-data.json "$target/compiled-data.json"
        echo "   ✅ $target"
    else
        echo "   ⚠️  スキップ: $target (ディレクトリが存在しません)"
    fi
done

# 元のディレクトリに戻る
cd "$CURRENT_DIR" || exit

echo ""
echo "✨ 完了！すべての環境にデータが反映されました"
echo ""
echo "💡 ヒント:"
echo "   - ブラウザで確認する際は、キャッシュをクリア（Ctrl+Shift+R）してください"
echo "   - ローカルサーバー起動: python3 -m http.server 8090"