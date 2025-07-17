#!/bin/bash
# URLパラメータテストスクリプト

echo "=== URLパラメータテスト開始 ==="
echo "実行時刻: $(date +"%Y-%m-%d %H:%M:%S")"
echo ""

# テストケース定義
test_cases=("東京_013" "店舗なし_052" "大阪_027" "埼玉_011")

# 各テストケースを実行
for test_case in "${test_cases[@]}"; do
    test_name="${test_case%_*}"
    region_id="${test_case#*_}"
    url="http://localhost:8000/?region_id=$region_id"
    
    echo "テスト: $test_name (region_id=$region_id)"
    echo "URL: $url"
    
    # HTTPステータスとレスポンス時間を取得
    response=$(curl -s -o /dev/null -w "HTTP Status: %{http_code}, Response Time: %{time_total}s" "$url")
    echo "結果: $response"
    
    # HTMLコンテンツの一部を取得して確認
    content=$(curl -s "$url" | grep -E "(selected-region-name|error-message)" | head -5)
    if [ -n "$content" ]; then
        echo "コンテンツ確認: ✓"
    else
        echo "コンテンツ確認: ✗ エラーの可能性"
    fi
    
    echo "---"
done

echo ""
echo "=== Javascriptコンソールエラーチェック ==="
echo "ブラウザで以下のURLを開いてコンソールを確認してください："
echo "1. http://localhost:8000/?region_id=052 (店舗なし)"
echo "2. http://localhost:8000/?region_id=013 (東京)"
echo ""
echo "テスト完了: $(date +"%Y-%m-%d %H:%M:%S")"