# Makefile for CSV data update
# 使い方: make update

.PHONY: update convert copy help

# デフォルトターゲット
help:
	@echo "使用可能なコマンド:"
	@echo "  make update    - CSVをJSONに変換して全環境に配布"
	@echo "  make convert   - CSVをJSONに変換のみ"
	@echo "  make copy      - 既存のJSONを全環境にコピーのみ"
	@echo "  make clean     - 生成されたJSONファイルを削除"

# CSV更新から配布まで一括実行
update: convert copy
	@echo "✨ 完了！"

# CSVからJSONへの変換
convert:
	@echo "📊 CSVファイルをJSONに変換中..."
	@node convert-csv-to-json.js

# 全環境へのコピー
copy:
	@echo "📁 各環境にファイルをコピー中..."
	@cp compiled-data.json ../draft/data/ 2>/dev/null && echo "   ✅ draft" || echo "   ⚠️  draft (スキップ)"
	@cp compiled-data.json ../draft002/data/ 2>/dev/null && echo "   ✅ draft002" || echo "   ⚠️  draft002 (スキップ)"
	@cp compiled-data.json ../medical-diet001/data/ 2>/dev/null && echo "   ✅ medical-diet001" || echo "   ⚠️  medical-diet001 (スキップ)"
	@cp compiled-data.json ../medical-diet002/data/ 2>/dev/null && echo "   ✅ medical-diet002" || echo "   ⚠️  medical-diet002 (スキップ)"
	@cp compiled-data.json ../cryolipolysis/data/ 2>/dev/null && echo "   ✅ cryolipolysis" || echo "   ⚠️  cryolipolysis (スキップ)"
	@cp compiled-data.json ../injection-lipolysis001/data/ 2>/dev/null && echo "   ✅ injection-lipolysis001" || echo "   ⚠️  injection-lipolysis001 (スキップ)"
	@cp compiled-data.json ../potenza001/data/ 2>/dev/null && echo "   ✅ potenza001" || echo "   ⚠️  potenza001 (スキップ)"

# クリーンアップ
clean:
	@echo "🧹 JSONファイルを削除中..."
	@rm -f compiled-data.json
	@echo "   ✅ 削除完了"