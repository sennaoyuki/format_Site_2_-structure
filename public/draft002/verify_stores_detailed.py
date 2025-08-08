from playwright.sync_api import sync_playwright
import time

url = "http://localhost:8090/draft002/?region_id=056&ad_id=test1234&gclid=123456&utm_creative=12345&max_scroll=25&comparison_tab=%E7%B7%8F%E5%90%88&tips_tab=%E5%8C%BB%E7%99%82%E7%97%A9%E8%BA%AB%E3%81%AE%E5%8A%B9%E6%9E%9C&tips_index=0"

def detailed_check():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        console_errors = []
        console_logs = []
        
        def handle_console_msg(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
            elif msg.type == 'log':
                console_logs.append(msg.text)
                
        page.on('console', handle_console_msg)
        
        try:
            print(f"アクセス中: {url}")
            page.goto(url, timeout=30000)
            page.wait_for_load_state('domcontentloaded')
            time.sleep(8)  # 十分な待機時間
            
            # より詳細な要素チェック
            element_check = page.evaluate("""
                () => {
                    return {
                        brandSectionWrapper: !!document.querySelector('.brand-section-wrapper'),
                        brandSection: !!document.querySelector('.brand-section'),
                        clinicStoresSection: document.querySelectorAll('.clinic-stores-section').length,
                        storesList: document.querySelectorAll('.stores-list').length,
                        storeItem: document.querySelectorAll('.store-item').length,
                        storeName: document.querySelectorAll('.store-name').length,
                        storeAddress: document.querySelectorAll('.store-address').length,
                        storeCard: document.querySelectorAll('.store-card').length,
                        storeInfo: document.querySelectorAll('.store-info').length,
                        wrapperHTML: document.querySelector('.brand-section-wrapper') ? 
                            document.querySelector('.brand-section-wrapper').innerHTML.substring(0, 500) : 'なし'
                    };
                }
            """)
            
            print("\n詳細要素チェック:")
            for key, value in element_check.items():
                print(f"  {key}: {value}")
            
            # データ取得状況の確認
            data_check = page.evaluate("""
                () => {
                    if (window.app && window.app.dataManager) {
                        const stores = window.app.dataManager.getStoresByRegionId('056');
                        const allClinics = window.app.dataManager.getClinics();
                        const ranking = window.app.dataManager.getRankingByRegionId('056');
                        
                        return {
                            storesData: stores ? stores.map(s => ({name: s.storeName, clinicName: s.clinicName})) : [],
                            clinicsCount: allClinics ? allClinics.length : 0,
                            hasRanking: !!ranking,
                            rankingData: ranking ? Object.keys(ranking.ranks) : []
                        };
                    }
                    return {error: 'app or dataManager not found'};
                }
            """)
            
            print("\nデータ取得状況:")
            for key, value in data_check.items():
                print(f"  {key}: {value}")
            
            # updateStoresDisplay関数の呼び出し状況を確認
            function_check = page.evaluate("""
                () => {
                    if (window.app && window.app.displayManager && window.app.displayManager.updateStoresDisplay) {
                        return {
                            hasUpdateStoresDisplay: true,
                            functionSource: window.app.displayManager.updateStoresDisplay.toString().substring(0, 300)
                        };
                    }
                    return {hasUpdateStoresDisplay: false};
                }
            """)
            
            print("\n関数存在確認:")
            for key, value in function_check.items():
                print(f"  {key}: {value}")
            
            # 関連するコンソールログを表示
            if console_logs:
                print("\nコンソールログ（最新10件）:")
                for log in console_logs[-10:]:
                    print(f"  - {log}")
            
            if console_errors:
                print("\nコンソールエラー:")
                for error in console_errors:
                    print(f"  - {error}")
                    
            return element_check
            
        except Exception as e:
            print(f"エラーが発生: {e}")
            return {'error': str(e)}
        finally:
            browser.close()

if __name__ == "__main__":
    result = detailed_check()
    
    if 'error' not in result:
        print("\n=== 修正結果の評価 ===")
        if result['storeItem'] > 0:
            print("✅ 店舗情報の表示に成功しました")
            print(f"   - 店舗アイテム: {result['storeItem']}件")
            print(f"   - 店舗名: {result['storeName']}件")
            print(f"   - 住所: {result['storeAddress']}件")
        else:
            print("❌ 店舗情報が表示されていません")
            
        if result['brandSectionWrapper']:
            print("✅ ブランドセクションラッパーが存在します")
        else:
            print("❌ ブランドセクションラッパーが存在しません")
    else:
        print(f"❌ 検証エラー: {result['error']}")