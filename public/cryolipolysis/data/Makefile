# injection-lipolysis001 データ管理用 Makefile
# 使い方: make [コマンド]

.PHONY: help convert-all convert-common convert-clinic convert-main clean check

# デフォルトターゲット（ヘルプを表示）
help:
	@echo "🔧 injection-lipolysis001 データ管理コマンド"
	@echo ""
	@echo "使用可能なコマンド:"
	@echo "  make convert-all    - すべてのCSVをJSONに変換"
	@echo "  make convert-common - 共通テキストのみ変換"
	@echo "  make convert-clinic - クリニックテキストのみ変換"
	@echo "  make convert-main   - メインデータのみ変換"
	@echo "  make check          - 変換前後の差分を確認"
	@echo "  make clean          - JSONファイルを削除（注意！）"
	@echo ""

# すべてのCSVを変換
convert-all:
	@echo "🔄 すべてのCSVファイルをJSONに変換します..."
	@./convert-all-csv.sh

# 共通テキストのみ変換
convert-common:
	@echo "📄 共通テキストを変換中..."
	@node convert-common-texts-to-json.js

# クリニックテキストのみ変換
convert-clinic:
	@echo "🏥 クリニックテキストを変換中..."
	@node convert-clinic-texts-to-json.js

# メインデータのみ変換
convert-main:
	@echo "📊 メインデータを変換中..."
	@node convert-csv-to-json.js

# 変換結果をチェック
check:
	@echo "📋 現在のCSVとJSONファイル:"
	@echo ""
	@echo "CSVファイル:"
	@ls -la *.csv 2>/dev/null || echo "  CSVファイルが見つかりません"
	@echo ""
	@echo "JSONファイル:"
	@ls -la *.json | grep -v package.json 2>/dev/null || echo "  JSONファイルが見つかりません"

# JSONファイルをクリーン（開発用）
clean:
	@echo "⚠️  警告: JSONファイルを削除しようとしています"
	@echo "続行するには5秒待ってください... (Ctrl+Cでキャンセル)"
	@sleep 5
	@rm -f site-common-texts.json clinic-texts.json compiled-data.json site-texts.json
	@echo "✅ JSONファイルを削除しました"