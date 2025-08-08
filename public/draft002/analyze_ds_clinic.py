from playwright.sync_api import sync_playwright
import time
import json

def analyze_draft002_ds_clinic():
    with sync_playwright() as p:
        # ブラウザを起動（headless=Falseでブラウザウィンドウを表示）
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        
        # コンソールログを監視
        console_logs = []
        def handle_console_msg(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(f"Console: {log_entry}")
        
        page.on("console", handle_console_msg)
        
        try:
            # draft002サイト（渋谷地域）にアクセス
            url = "http://localhost:8090/draft002/?region_id=056&ad_id=test1234&gclid=123456&utm_creative=12345&max_scroll=25&comparison_tab=%E7%B7%8F%E5%90%88&tips_tab=%E5%8C%BB%E7%99%82%E7%97%A9%E8%BA%AB%E3%81%AE%E5%8A%B9%E6%9E%9C&tips_index=0"
            print(f"🌐 アクセスURL: {url}")
            
            page.goto(url, wait_until='domcontentloaded')
            
            # ページの読み込み完了を待機
            print("⏳ ページ読み込み完了を待機中...")
            page.wait_for_load_state('networkidle', timeout=15000)
            time.sleep(5)  # 追加的な待機
            
            # ページタイトルとURLの確認
            title = page.title()
            current_url = page.url
            print(f"📄 ページタイトル: {title}")
            print(f"🔗 現在のURL: {current_url}")
            
            # 初期状態のスクリーンショット
            print("📸 初期状態のスクリーンショット撮影...")
            page.screenshot(path='analysis_step1_initial.png', full_page=True)
            
            # ランキングセクションの存在確認
            print("🔍 ランキングセクションの確認...")
            ranking_elements = page.query_selector_all('.ranking-item')
            print(f"見つかったランキングアイテム数: {len(ranking_elements)}")
            
            # 各ランキングアイテムの詳細を確認
            ranking_details = []
            for i, element in enumerate(ranking_elements[:4]):  # 上位4位まで確認
                try:
                    rank_num = element.query_selector('.rank-number')
                    clinic_name = element.query_selector('.clinic-name')
                    
                    rank = rank_num.inner_text() if rank_num else "不明"
                    name = clinic_name.inner_text() if clinic_name else "不明"
                    
                    ranking_details.append({
                        "position": i + 1,
                        "rank": rank,
                        "name": name
                    })
                    print(f"  {i+1}位: {name} (ランク表示: {rank})")
                except Exception as e:
                    print(f"  ランキング{i+1}の取得でエラー: {e}")
            
            # 店舗情報セクションの確認
            print("🏥 店舗情報セクションの確認...")
            store_elements = page.query_selector_all('.store-item')
            print(f"見つかった店舗アイテム数: {len(store_elements)}")
            
            # DSクリニック関連の要素を探す
            print("🔍 DSクリニック関連要素の検索...")
            ds_elements = page.query_selector_all('*[class*="dsc"], *[class*="dsc"], *[id*="dsc"], *[id*="dsc"]')
            print(f"DS関連要素数: {len(ds_elements)}")
            
            # clinic_3とclinic_6関連要素の確認
            clinic3_elements = page.query_selector_all('*[class*="clinic_3"], *[id*="clinic_3"]')
            clinic6_elements = page.query_selector_all('*[class*="clinic_6"], *[id*="clinic_6"]')
            print(f"clinic_3関連要素数: {len(clinic3_elements)}")
            print(f"clinic_6関連要素数: {len(clinic6_elements)}")
            
            # JavaScriptでデバッグ情報を取得
            print("💻 JavaScript経由でのデバッグ情報取得...")
            debug_info = page.evaluate("""() => {
                const debug = {
                    currentRegion: window.currentRegion || 'undefined',
                    rankingData: window.rankingData || 'undefined',
                    storeData: window.storeData || 'undefined',
                    clinicMapping: {}
                };
                
                // ランキングデータの確認
                if (window.rankingData) {
                    debug.rankingKeys = Object.keys(window.rankingData);
                }
                
                // 店舗データの確認
                if (window.storeData) {
                    debug.storeKeys = Object.keys(window.storeData);
                }
                
                return debug;
            }""")
            
            print("📊 デバッグ情報:")
            print(json.dumps(debug_info, indent=2, ensure_ascii=False))
            
            return {
                "success": True,
                "title": title,
                "url": current_url,
                "ranking_count": len(ranking_elements),
                "ranking_details": ranking_details,
                "store_count": len(store_elements),
                "ds_elements_count": len(ds_elements),
                "clinic3_elements_count": len(clinic3_elements),
                "clinic6_elements_count": len(clinic6_elements),
                "debug_info": debug_info,
                "console_logs": console_logs[-10:],  # 最新10件のログ
                "screenshot_taken": "analysis_step1_initial.png"
            }
            
        except Exception as e:
            print(f"❌ エラーが発生しました: {e}")
            # エラー時もスクリーンショットを撮影
            try:
                page.screenshot(path='analysis_step1_error.png', full_page=True)
            except:
                pass
            return {"success": False, "error": str(e)}
        finally:
            print("🔚 ブラウザを閉じています...")
            browser.close()

if __name__ == "__main__":
    print("🚀 TADA方式 Step1: draft002サイト（渋谷）DSクリニック分析開始")
    result = analyze_draft002_ds_clinic()
    
    print("\n" + "="*60)
    print("📋 分析結果サマリー")
    print("="*60)
    
    if result.get("success"):
        print(f"✅ ページアクセス成功")
        print(f"📄 タイトル: {result['title']}")
        print(f"🏆 ランキングアイテム数: {result['ranking_count']}")
        print(f"🏥 店舗アイテム数: {result['store_count']}")
        print(f"🔍 DS関連要素数: {result['ds_elements_count']}")
        print(f"🏥 clinic_3関連要素数: {result['clinic3_elements_count']}")
        print(f"🏥 clinic_6関連要素数: {result['clinic6_elements_count']}")
        print(f"📸 スクリーンショット: {result['screenshot_taken']}")
        
        print(f"\n📊 ランキング詳細:")
        for detail in result['ranking_details']:
            print(f"  {detail['position']}位: {detail['name']}")
    else:
        print(f"❌ 分析失敗: {result.get('error')}")