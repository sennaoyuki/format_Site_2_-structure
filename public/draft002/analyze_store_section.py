from playwright.sync_api import sync_playwright
import time
import json

def analyze_store_section():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        
        console_logs = []
        def handle_console_msg(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(f"Console: {log_entry}")
        
        page.on("console", handle_console_msg)
        
        try:
            url = "http://localhost:8090/draft002/?region_id=056&ad_id=test1234&gclid=123456&utm_creative=12345&max_scroll=25&comparison_tab=%E7%B7%8F%E5%90%88&tips_tab=%E5%8C%BB%E7%99%82%E7%97%A9%E8%BA%AB%E3%81%AE%E5%8A%B9%E6%9E%9C&tips_index=0"
            print(f"🌐 アクセス中...")
            
            page.goto(url, wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=15000)
            time.sleep(5)
            
            print("🏥 店舗情報セクションの詳細分析...")
            
            # 店舗セクション全体をスクロールして確認
            page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.8)")
            time.sleep(2)
            
            # 店舗情報セクションのスクリーンショット
            print("📸 店舗情報セクションのスクリーンショット...")
            page.screenshot(path='analysis_step3_stores.png', full_page=True)
            
            # 店舗情報を詳しく調査
            store_analysis = page.evaluate("""() => {
                const analysis = {
                    store_sections: [],
                    ds_clinic_found: false,
                    ds_clinic_details: null,
                    all_store_ids: [],
                    ranking_vs_store_mapping: {}
                };
                
                // すべての店舗セクションを確認
                const storeItems = document.querySelectorAll('.store-item, .brand-section, .clinic-detail');
                console.log(`🏪 見つかった店舗関連要素: ${storeItems.length}`);
                
                storeItems.forEach((item, index) => {
                    const name = item.querySelector('.store-name, .brand-name, h3, h4');
                    const address = item.querySelector('.store-address, .address');
                    const access = item.querySelector('.store-access, .access');
                    
                    const storeInfo = {
                        index: index,
                        name: name ? name.textContent.trim() : '名前不明',
                        address: address ? address.textContent.trim() : '住所なし',
                        access: access ? access.textContent.trim() : 'アクセス情報なし',
                        className: item.className,
                        id: item.id || 'ID なし'
                    };
                    
                    analysis.store_sections.push(storeInfo);
                    
                    // DSクリニック関連をチェック
                    if (storeInfo.name.includes('DS') || 
                        storeInfo.name.includes('ディーエス') || 
                        storeInfo.address.includes('渋谷3-11-2')) {
                        analysis.ds_clinic_found = true;
                        analysis.ds_clinic_details = storeInfo;
                    }
                });
                
                // データ構造の詳細確認
                if (window.storeData) {
                    analysis.available_store_data = {};
                    for (const [region, stores] of Object.entries(window.storeData)) {
                        if (region === '056' || region === 'default') {
                            analysis.available_store_data[region] = stores;
                        }
                    }
                }
                
                // clinic_3とclinic_6のマッピング状況を確認
                if (window.storeData && window.storeData['056']) {
                    const region056 = window.storeData['056'];
                    analysis.clinic_3_data = region056.clinic_3 || 'なし';
                    analysis.clinic_6_data = region056.clinic_6 || 'なし';
                }
                
                // ランキングデータとの対応を確認
                if (window.rankingData && window.rankingData['056']) {
                    const ranking = window.rankingData['056'].ranks;
                    analysis.ranking_vs_store_mapping = {
                        'no1_clinic_id': ranking.no1,
                        'no2_clinic_id': ranking.no2,  // これが6のはず
                        'no3_clinic_id': ranking.no3,
                        'no4_clinic_id': ranking.no4
                    };
                }
                
                return analysis;
            }""")
            
            print("📊 店舗情報分析結果:")
            print(json.dumps(store_analysis, indent=2, ensure_ascii=False))
            
            # DSクリニック検索の詳細
            print(f"🔍 DSクリニック発見: {store_analysis['ds_clinic_found']}")
            if store_analysis['ds_clinic_details']:
                print(f"📍 DSクリニック詳細: {store_analysis['ds_clinic_details']}")
            
            # 特定のDSクリニック要素をDOM検索
            ds_elements = page.query_selector_all('*[class*="dsc"], *[class*="dsc"], *[data-clinic="6"], *[data-clinic-id="6"]')
            print(f"🔍 DOM内DS関連要素数: {len(ds_elements)}")
            
            # clinic_3要素の確認
            clinic3_elements = page.query_selector_all('*[class*="clinic_3"], *[id*="clinic_3"]')
            print(f"🏥 clinic_3関連要素数: {len(clinic3_elements)}")
            
            if len(clinic3_elements) > 0:
                print("📋 clinic_3関連要素:")
                for i, elem in enumerate(clinic3_elements):
                    try:
                        text = elem.inner_text()[:100] if elem.inner_text() else "テキストなし"
                        print(f"  {i+1}. クラス: {elem.get_attribute('class')}, テキスト: {text}")
                    except:
                        print(f"  {i+1}. 要素情報取得エラー")
            
            return {
                "success": True,
                "ds_clinic_found": store_analysis['ds_clinic_found'],
                "ds_clinic_details": store_analysis.get('ds_clinic_details'),
                "total_stores": len(store_analysis['store_sections']),
                "store_sections": store_analysis['store_sections'],
                "clinic_mapping": {
                    "clinic_3_data": store_analysis.get('clinic_3_data'),
                    "clinic_6_data": store_analysis.get('clinic_6_data')
                },
                "ranking_mapping": store_analysis.get('ranking_vs_store_mapping', {}),
                "ds_dom_elements": len(ds_elements),
                "clinic3_dom_elements": len(clinic3_elements),
                "screenshot": "analysis_step3_stores.png"
            }
            
        except Exception as e:
            print(f"❌ エラー: {e}")
            try:
                page.screenshot(path='analysis_step3_error.png', full_page=True)
            except:
                pass
            return {"success": False, "error": str(e)}
        finally:
            browser.close()

if __name__ == "__main__":
    print("🏥 Step3: 店舗情報セクション詳細分析")
    result = analyze_store_section()
    
    print("\n" + "="*60)
    print("📋 店舗情報セクション分析結果")
    print("="*60)
    
    if result.get("success"):
        print(f"🏥 総店舗数: {result['total_stores']}")
        print(f"🔍 DSクリニック発見: {'✅ あり' if result['ds_clinic_found'] else '❌ なし'}")
        print(f"🔍 DS DOM要素: {result['ds_dom_elements']}")
        print(f"🔍 clinic_3 DOM要素: {result['clinic3_dom_elements']}")
        
        print(f"\n📊 データマッピング状況:")
        print(f"  clinic_3_data: {result['clinic_mapping']['clinic_3_data']}")
        print(f"  clinic_6_data: {result['clinic_mapping']['clinic_6_data']}")
        
        print(f"\n🏆 ランキングマッピング:")
        for key, value in result['ranking_mapping'].items():
            print(f"  {key}: {value}")
        
        if result['ds_clinic_details']:
            print(f"\n📍 DSクリニック詳細:")
            details = result['ds_clinic_details']
            print(f"  名前: {details['name']}")
            print(f"  住所: {details['address']}")
            print(f"  アクセス: {details['access']}")
        
        print(f"\n🏪 全店舗情報:")
        for store in result['store_sections']:
            print(f"  {store['index']+1}. {store['name']} - {store['address'][:50]}...")
    else:
        print(f"❌ 分析失敗: {result.get('error')}")