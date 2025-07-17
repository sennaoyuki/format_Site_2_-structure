#!/bin/bash

# プロジェクトステータス確認スクリプト
# 作成者: Worker3
# 用途: 現在のプロジェクト状況を一覧表示

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "   プロジェクトステータス確認"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "========================================${NC}"

# 1. ファイル構成確認
echo -e "\n${YELLOW}■ プロジェクトファイル構成${NC}"
echo "ルートディレクトリ: $(pwd)"
echo ""
echo "【フロントエンド】"
[ -f "public/index.html" ] && echo -e "${GREEN}✓${NC} public/index.html" || echo -e "${RED}✗${NC} public/index.html"
[ -f "public/app.js" ] && echo -e "${GREEN}✓${NC} public/app.js" || echo -e "${RED}✗${NC} public/app.js"
[ -f "public/data-manager.js" ] && echo -e "${GREEN}✓${NC} public/data-manager.js" || echo -e "${RED}✗${NC} public/data-manager.js"
[ -f "public/styles.css" ] && echo -e "${GREEN}✓${NC} public/styles.css" || echo -e "${RED}✗${NC} public/styles.css"

echo ""
echo "【管理画面】"
[ -f "admin/index.html" ] && echo -e "${GREEN}✓${NC} admin/index.html" || echo -e "${RED}✗${NC} admin/index.html"
[ -f "admin/admin-script.js" ] && echo -e "${GREEN}✓${NC} admin/admin-script.js" || echo -e "${RED}✗${NC} admin/admin-script.js"
[ -f "admin/csv-manager.js" ] && echo -e "${GREEN}✓${NC} admin/csv-manager.js" || echo -e "${RED}✗${NC} admin/csv-manager.js"
[ -f "admin/admin-style.css" ] && echo -e "${GREEN}✓${NC} admin/admin-style.css" || echo -e "${RED}✗${NC} admin/admin-style.css"

echo ""
echo "【CSVデータ】"
for csv in "出しわけSS - items.csv" "出しわけSS - ranking.csv" "出しわけSS - region.csv" "出しわけSS - stores.csv" "出しわけSS - store_view.csv"; do
    [ -f "public/data/$csv" ] && echo -e "${GREEN}✓${NC} $csv" || echo -e "${RED}✗${NC} $csv"
done

# 2. ドキュメント確認
echo -e "\n${YELLOW}■ ドキュメント一覧${NC}"
for doc in *.md; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc ($(wc -l < "$doc") 行)"
    fi
done

# 3. テストファイル確認
echo -e "\n${YELLOW}■ テスト関連ファイル${NC}"
[ -d "test-files" ] && echo -e "${GREEN}✓${NC} test-files/" || echo -e "${YELLOW}!${NC} test-files/ (未作成)"
[ -f "integration-test-script.sh" ] && echo -e "${GREEN}✓${NC} integration-test-script.sh" || echo -e "${RED}✗${NC} integration-test-script.sh"
[ -f "mock-api-server.py" ] && echo -e "${GREEN}✓${NC} mock-api-server.py" || echo -e "${RED}✗${NC} mock-api-server.py"

# 4. サーバープロセス確認
echo -e "\n${YELLOW}■ サーバープロセス状態${NC}"
if lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} フロントエンドサーバー (ポート 8000) - 稼働中"
else
    echo -e "${RED}✗${NC} フロントエンドサーバー (ポート 8000) - 停止中"
fi

if lsof -i:8002 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 管理画面サーバー (ポート 8002) - 稼働中"
else
    echo -e "${RED}✗${NC} 管理画面サーバー (ポート 8002) - 停止中"
fi

if lsof -i:8003 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} モックAPIサーバー (ポート 8003) - 稼働中"
else
    echo -e "${YELLOW}!${NC} モックAPIサーバー (ポート 8003) - 停止中"
fi

# 5. Worker別タスク状況
echo -e "\n${YELLOW}■ Worker別実装状況${NC}"
echo "Worker1 (フロントエンド):"
echo -e "  ${GREEN}✓${NC} ランキングサイトUI"
echo -e "  ${GREEN}✓${NC} アクセシビリティ対応"
echo -e "  ${GREEN}✓${NC} 管理画面UI実装"
echo -e "  ${GREEN}✓${NC} 緊急修正（店舗表示）"

echo ""
echo "Worker2 (バックエンド):"
echo -e "  ${GREEN}✓${NC} 地域データなし対応"
echo -e "  ${YELLOW}🔄${NC} サーバーサイドAPI実装（進行中）"
echo -e "  ${YELLOW}⏳${NC} 完了予定: 13:30"

echo ""
echo "Worker3 (品質保証):"
echo -e "  ${GREEN}✓${NC} セキュリティテスト"
echo -e "  ${GREEN}✓${NC} パフォーマンステスト"
echo -e "  ${GREEN}✓${NC} 管理画面動作確認"
echo -e "  ${GREEN}✓${NC} デプロイ手順書作成"
echo -e "  ${GREEN}✓${NC} 統合テスト準備"
echo -e "  ${YELLOW}⏳${NC} 統合テスト実施（Worker2待ち）"

# 6. 次のアクション
echo -e "\n${YELLOW}■ 次のアクション${NC}"
current_time=$(date +%H:%M)
echo "現在時刻: $current_time"
echo ""
echo "1. Worker2の実装完了待ち（13:30予定）"
echo "2. 統合テストの実施"
echo "3. 最終確認書の作成"
echo "4. PRESIDENTへの完了報告"

# 7. コマンドガイド
echo -e "\n${YELLOW}■ 便利なコマンド${NC}"
echo "フロントエンド起動: cd public && python3 -m http.server 8000"
echo "管理画面起動: cd admin && python3 -m http.server 8002"
echo "モックAPI起動: python3 mock-api-server.py"
echo "統合テスト実行: ./integration-test-script.sh"
echo "エージェント間通信: ./agent-send.sh [相手] \"[メッセージ]\""

echo -e "\n${BLUE}========================================${NC}"