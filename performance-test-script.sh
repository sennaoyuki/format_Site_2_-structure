#!/bin/bash

# パフォーマンステスト実行スクリプト
# Worker3 - 2025-07-17

echo "=== パフォーマンステスト開始 ==="
echo "実行時刻: $(date)"

ADMIN_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:8000"
TEST_FILES_DIR="test-files"

# テスト結果記録
RESULT_FILE="performance-test-results.log"
echo "Performance Test Results - $(date)" > $RESULT_FILE

# 1. フロントエンド応答時間テスト
echo "1. フロントエンド応答時間テスト" | tee -a $RESULT_FILE
for i in {1..5}; do
    echo "Test $i:" | tee -a $RESULT_FILE
    curl -s -o /dev/null -w "  Response Time: %{time_total}s, Size: %{size_download} bytes\n" $FRONTEND_URL | tee -a $RESULT_FILE
done

# 2. 管理画面応答時間テスト
echo "2. 管理画面応答時間テスト" | tee -a $RESULT_FILE
for i in {1..5}; do
    echo "Test $i:" | tee -a $RESULT_FILE
    curl -s -o /dev/null -w "  Response Time: %{time_total}s, Size: %{size_download} bytes\n" $ADMIN_URL | tee -a $RESULT_FILE
done

# 3. 大容量ファイル処理時間測定
echo "3. 大容量ファイル処理時間" | tee -a $RESULT_FILE
echo "Large file processing simulation..." | tee -a $RESULT_FILE
start_time=$(date +%s.%N)
# ファイル読み込みシミュレーション
wc -l $TEST_FILES_DIR/large-test.csv > /dev/null
end_time=$(date +%s.%N)
processing_time=$(echo "$end_time - $start_time" | bc)
echo "  Processing time: ${processing_time}s" | tee -a $RESULT_FILE

# 4. メモリ使用量確認
echo "4. メモリ使用量確認" | tee -a $RESULT_FILE
echo "  Current memory usage:" | tee -a $RESULT_FILE
ps aux | grep -E 'python.*server' | grep -v grep | awk '{print "  PID: "$2", Memory: "$4"%"}' | tee -a $RESULT_FILE

# 5. 同時アクセステスト（軽量版）
echo "5. 同時アクセステスト" | tee -a $RESULT_FILE
echo "Testing concurrent access..." | tee -a $RESULT_FILE
for i in {1..3}; do
    curl -s -o /dev/null -w "Concurrent test $i: %{time_total}s\n" $FRONTEND_URL &
done
wait
echo "  Concurrent tests completed" | tee -a $RESULT_FILE

echo "=== パフォーマンステスト完了 ===" | tee -a $RESULT_FILE
echo "結果ファイル: $RESULT_FILE"