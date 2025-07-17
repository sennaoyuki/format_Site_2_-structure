#!/bin/bash

# 統合テストスクリプト
# 作成者: Worker3
# 作成日時: 2025-07-17 12:18
# 用途: Worker2のサーバー実装完了後の統合テスト自動化

# 設定
FRONTEND_URL="http://localhost:8000"
ADMIN_URL="http://localhost:8002"
API_BASE_URL="http://localhost:8002/admin/api"
TEST_DIR="$(pwd)/test-files"
LOG_FILE="integration-test-results-$(date +%Y%m%d-%H%M%S).log"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1" | tee -a "$LOG_FILE"
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1" | tee -a "$LOG_FILE"
}

# テスト開始
log "========== 統合テスト開始 =========="
log "Frontend URL: $FRONTEND_URL"
log "Admin URL: $ADMIN_URL"
log "API Base URL: $API_BASE_URL"

# 1. 基本接続テスト
echo ""
log "=== 1. 基本接続テスト ==="

# 1.1 フロントエンド接続確認
info "フロントエンド接続確認..."
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    pass "フロントエンド接続成功"
else
    fail "フロントエンド接続失敗"
fi

# 1.2 管理画面接続確認
info "管理画面接続確認..."
if curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL" | grep -q "200"; then
    pass "管理画面接続成功"
else
    fail "管理画面接続失敗"
fi

# 1.3 APIヘルスチェック
info "APIヘルスチェック..."
HEALTH_CHECK=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/health")
if echo "$HEALTH_CHECK" | tail -n 1 | grep -q "200"; then
    pass "APIヘルスチェック成功"
else
    fail "APIヘルスチェック失敗"
fi

# 2. ファイルアップロードテスト
echo ""
log "=== 2. ファイルアップロードテスト ==="

# 2.1 単一ファイルアップロード
info "地域データアップロードテスト..."
UPLOAD_RESPONSE=$(curl -s -X POST \
    -F "file=@$TEST_DIR/出しわけSS - region.csv" \
    -F "type=region" \
    -w "\n%{http_code}" \
    "$API_BASE_URL/upload")

if echo "$UPLOAD_RESPONSE" | tail -n 1 | grep -q "200"; then
    pass "地域データアップロード成功"
else
    fail "地域データアップロード失敗"
fi

# 2.2 大容量ファイルテスト（10MB超）
info "大容量ファイルエラーテスト..."
LARGE_FILE_RESPONSE=$(curl -s -X POST \
    -F "file=@$TEST_DIR/large-test.csv" \
    -F "type=region" \
    -w "\n%{http_code}" \
    "$API_BASE_URL/upload")

if echo "$LARGE_FILE_RESPONSE" | tail -n 1 | grep -q "413\|400"; then
    pass "大容量ファイル制限動作確認"
else
    fail "大容量ファイル制限が機能していない"
fi

# 3. データ検証テスト
echo ""
log "=== 3. データ検証テスト ==="

info "データ検証API呼び出し..."
VALIDATE_RESPONSE=$(curl -s -X POST \
    -w "\n%{http_code}" \
    "$API_BASE_URL/validate")

if echo "$VALIDATE_RESPONSE" | tail -n 1 | grep -q "200"; then
    pass "データ検証API成功"
else
    fail "データ検証API失敗"
fi

# 4. データ保存テスト
echo ""
log "=== 4. データ保存テスト ==="

info "データ保存API呼び出し..."
SAVE_RESPONSE=$(curl -s -X POST \
    -w "\n%{http_code}" \
    "$API_BASE_URL/save")

if echo "$SAVE_RESPONSE" | tail -n 1 | grep -q "200"; then
    pass "データ保存API成功"
else
    fail "データ保存API失敗"
fi

# 5. バックアップテスト
echo ""
log "=== 5. バックアップテスト ==="

# 5.1 バックアップ作成
info "バックアップ作成テスト..."
BACKUP_CREATE_RESPONSE=$(curl -s -X POST \
    -w "\n%{http_code}" \
    "$API_BASE_URL/backup/create")

if echo "$BACKUP_CREATE_RESPONSE" | tail -n 1 | grep -q "200"; then
    pass "バックアップ作成成功"
    BACKUP_ID=$(echo "$BACKUP_CREATE_RESPONSE" | head -n -1 | jq -r '.backup_id' 2>/dev/null || echo "")
else
    fail "バックアップ作成失敗"
fi

# 5.2 バックアップリスト取得
info "バックアップリスト取得テスト..."
BACKUP_LIST_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/backup/list")

if echo "$BACKUP_LIST_RESPONSE" | tail -n 1 | grep -q "200"; then
    pass "バックアップリスト取得成功"
else
    fail "バックアップリスト取得失敗"
fi

# 6. パフォーマンステスト
echo ""
log "=== 6. パフォーマンステスト ==="

# 6.1 レスポンス時間測定
info "APIレスポンス時間測定..."
START_TIME=$(date +%s.%N)
curl -s -o /dev/null "$API_BASE_URL/health"
END_TIME=$(date +%s.%N)
RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc)

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    pass "APIレスポンス時間: ${RESPONSE_TIME}秒 (目標1秒以内)"
else
    fail "APIレスポンス時間: ${RESPONSE_TIME}秒 (目標1秒超過)"
fi

# 6.2 同時アクセステスト
info "同時アクセステスト（5並列）..."
for i in {1..5}; do
    curl -s -o /dev/null "$API_BASE_URL/health" &
done
wait

if [ $? -eq 0 ]; then
    pass "同時アクセステスト成功"
else
    fail "同時アクセステスト失敗"
fi

# 7. セキュリティテスト
echo ""
log "=== 7. セキュリティテスト ==="

# 7.1 XSS対策確認
info "XSS対策確認..."
XSS_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"data":"<script>alert(1)</script>"}' \
    -w "\n%{http_code}" \
    "$API_BASE_URL/validate")

RESPONSE_BODY=$(echo "$XSS_RESPONSE" | head -n -1)
if echo "$RESPONSE_BODY" | grep -q "&lt;script&gt;"; then
    pass "XSS対策が機能している"
else
    fail "XSS対策が不十分"
fi

# 7.2 SQLインジェクション対策確認
info "SQLインジェクション対策確認..."
SQL_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"id":"1 OR 1=1"}' \
    -w "\n%{http_code}" \
    "$API_BASE_URL/validate")

if echo "$SQL_RESPONSE" | tail -n 1 | grep -q "400"; then
    pass "SQLインジェクション対策が機能している"
else
    fail "SQLインジェクション対策が不十分"
fi

# 8. エラーハンドリングテスト
echo ""
log "=== 8. エラーハンドリングテスト ==="

# 8.1 不正なリクエストテスト
info "不正なリクエストテスト..."
ERROR_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"invalid":"data"}' \
    -w "\n%{http_code}" \
    "$API_BASE_URL/upload")

if echo "$ERROR_RESPONSE" | tail -n 1 | grep -q "400"; then
    pass "不正なリクエストのエラーハンドリング成功"
else
    fail "不正なリクエストのエラーハンドリング失敗"
fi

# 9. 統合動作確認
echo ""
log "=== 9. 統合動作確認 ==="

# 9.1 エンドツーエンドテスト
info "エンドツーエンドテスト..."
# 1. ファイルアップロード → 2. 検証 → 3. 保存 → 4. フロントエンド確認

# テスト結果サマリー
echo ""
log "========== テスト結果サマリー =========="
PASS_COUNT=$(grep -c "✅ PASS" "$LOG_FILE")
FAIL_COUNT=$(grep -c "❌ FAIL" "$LOG_FILE")
TOTAL_COUNT=$((PASS_COUNT + FAIL_COUNT))

log "総テスト数: $TOTAL_COUNT"
log "成功: $PASS_COUNT"
log "失敗: $FAIL_COUNT"
log "成功率: $(echo "scale=2; $PASS_COUNT * 100 / $TOTAL_COUNT" | bc)%"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}==== 全テスト合格 ====${NC}"
else
    echo -e "${RED}==== 一部テスト失敗 ====${NC}"
fi

log "詳細なログは $LOG_FILE を参照してください"
log "========== 統合テスト完了 =========="