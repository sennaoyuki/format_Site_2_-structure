from playwright.sync_api import sync_playwright
import time

# draft002サイトの店舗情報表示機能を確認
url = "http://localhost:8090/draft002/?region_id=056&ad_id=test1234&gclid=123456&utm_creative=12345&max_scroll=25&comparison_tab=%E7%B7%8F%E5%90%88&tips_tab=%E5%8C%BB%E7%99%82%E7%97%A9%E8%BA%AB%E3%81%AE%E5%8A%B9%E6%9E%9C&tips_index=0"

def check_draft002_stores():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # コンソールエラーをキャプチャ
        console_errors = []
        def handle_console_msg(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
        page.on('console', handle_console_msg)
        
        try:
            # ページにアクセス
            print(f"アクセス中: {url}")
            page.goto(url, timeout=30000)
            
            # ページ読み込み待機
            page.wait_for_load_state('domcontentloaded')
            time.sleep(5)  # JavaScript実行のための待機時間
            
            # 検証項目1: 店舗カード（.store-card）が表示されているか
            store_cards = page.locator('.store-card')
            store_card_count = store_cards.count()
            print(f"店舗カード数: {store_card_count}")
            
            # 検証項目2: ブランドセクション（.brand-section-wrapper）が生成されているか
            brand_section = page.locator('.brand-section-wrapper')
            brand_section_exists = brand_section.count() > 0
            print(f"ブランドセクション存在: {brand_section_exists}")
            
            # 検証項目3: 渋谷地域の店舗情報が表示されているか
            store_info_elements = page.locator('.store-info')
            store_info_count = store_info_elements.count()
            print(f"店舗情報要素数: {store_info_count}")
            
            # 詳細な店舗情報の内容確認
            if store_info_count > 0:
                for i in range(min(3, store_info_count)):
                    store_element = store_info_elements.nth(i)
                    if store_element.is_visible():
                        store_name_element = store_element.locator('.store-name').first
                        store_name = store_name_element.text_content() if store_name_element.count() > 0 else "名前不明"
                        print(f"店舗 {i+1}: {store_name}")
            
            # スクリーンショットを撮影
            screenshot_path = "verification_screenshot.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"スクリーンショットを保存: {screenshot_path}")
            
            # データ読み込み状況確認
            script_result = page.evaluate("""
                () => {
                    // 店舗データの確認
                    let storeData = null;
                    let dataManager = null;
                    
                    if (window.app && window.app.dataManager) {
                        dataManager = window.app.dataManager;
                        if (dataManager.getStoresByRegionId) {
                            storeData = dataManager.getStoresByRegionId('056');
                        }
                    }
                    
                    return {
                        hasApp: !!window.app,
                        hasDataManager: !!dataManager,
                        storeDataCount: storeData ? storeData.length : 0,
                        brandSectionExists: document.querySelector('.brand-section-wrapper') !== null,
                        storeCardCount: document.querySelectorAll('.store-card').length,
                        currentRegionId: window.app ? window.app.currentRegionId : null
                    };
                }
            """)
            
            print("\nJavaScript実行結果:")
            for key, value in script_result.items():
                print(f"  {key}: {value}")
            
            # コンソールエラーの確認
            if console_errors:
                print("\nコンソールエラー:")
                for error in console_errors:
                    print(f"  - {error}")
            else:
                print("\nコンソールエラー: なし")
            
            # HTML要素の存在確認
            html_check = page.evaluate("""
                () => {
                    return {
                        brandSection: !!document.querySelector('.brand-section-wrapper'),
                        storeCards: document.querySelectorAll('.store-card').length,
                        storeInfos: document.querySelectorAll('.store-info').length,
                        clinicItems: document.querySelectorAll('.clinic-item').length
                    };
                }
            """)
            
            print("\nHTML要素チェック:")
            for key, value in html_check.items():
                print(f"  {key}: {value}")
            
            return {
                'store_card_count': store_card_count,
                'brand_section_exists': brand_section_exists,
                'store_info_count': store_info_count,
                'console_errors': console_errors,
                'script_result': script_result,
                'html_check': html_check
            }
            
        except Exception as e:
            print(f"エラーが発生しました: {e}")
            return {'error': str(e)}
        finally:
            browser.close()

# 検証実行
if __name__ == "__main__":
    result = check_draft002_stores()
    if 'error' not in result:
        print("\n=== 検証結果 ===")
        print(f"店舗カード表示: {result['store_card_count']}件")
        print(f"ブランドセクション: {'あり' if result['brand_section_exists'] else 'なし'}")
        print(f"店舗情報要素: {result['store_info_count']}件")
        print(f"コンソールエラー: {len(result['console_errors'])}件")
    else:
        print(f"検証でエラーが発生: {result['error']}")