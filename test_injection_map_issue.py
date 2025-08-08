#!/usr/bin/env python3
"""
injection-lipolysis001の地図ボタンとCTA問題をテスト
"""

import asyncio
from playwright.async_api import async_playwright

async def test_map_cta_issue():
    """地図ボタンとCTAの動作確認"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # コンソールエラーをキャッチ
        errors = []
        page.on('console', lambda msg: errors.append({'type': msg.type, 'text': msg.text}) if msg.type in ['error'] else None)
        
        try:
            print("🔍 injection-lipolysis001 地図ボタン・CTA問題テスト")
            test_url = "http://localhost:8090/injection-lipolysis001/?region_id=056&detail_click=%E3%83%87%E3%82%A3%E3%82%AA%E3%82%AF%E3%83%AA%E3%83%8B%E3%83%83%E3%82%AF&detail_rank=1#clinic1"
            print(f"アクセス中: {test_url}")
            
            response = await page.goto(test_url, wait_until='networkidle')
            print(f"Response status: {response.status}")
            
            await page.wait_for_timeout(3000)
            
            # 詳細セクションを探す
            detail_section = await page.query_selector('[data-clinic-id="1"]')
            if detail_section:
                print("✅ ディオクリニック詳細セクションが見つかりました")
                
                # 地図ボタンを探す
                map_buttons = await detail_section.query_selector_all('.map-toggle-btn')
                print(f"地図ボタン数: {len(map_buttons)}")
                
                if map_buttons:
                    # 最初の地図ボタンをクリック
                    first_button = map_buttons[0]
                    print("地図ボタンをクリック...")
                    await first_button.click()
                    await page.wait_for_timeout(1000)
                    
                    # 地図が表示されたか確認
                    map_accordion = await detail_section.query_selector('.map-accordion')
                    if map_accordion:
                        is_visible = await map_accordion.is_visible()
                        print(f"地図表示状態: {is_visible}")
                        
                        # スクリーンショットを撮る
                        await page.screenshot(path='map_opened_state.png', full_page=False)
                        print("スクリーンショット保存: map_opened_state.png")
                    
                    # CTAボタンを探す
                    cta_button = await detail_section.query_selector('.btn_second_primary a')
                    if cta_button:
                        href = await cta_button.get_attribute('href')
                        print(f"CTAボタンのhref: {href}")
                        
                        # CTAボタンをクリック可能か確認
                        is_clickable = await cta_button.is_enabled()
                        print(f"CTAボタンクリック可能: {is_clickable}")
                        
                        # CTAボタンの位置を確認
                        bbox = await cta_button.bounding_box()
                        if bbox:
                            print(f"CTAボタン位置: x={bbox['x']}, y={bbox['y']}, width={bbox['width']}, height={bbox['height']}")
                        
                        # CTAボタンが見えるかチェック
                        is_visible = await cta_button.is_visible()
                        print(f"CTAボタン表示状態: {is_visible}")
                    else:
                        print("❌ CTAボタンが見つかりません")
                    
                    # 店舗表示の崩れをチェック
                    shops = await detail_section.query_selector_all('.shop')
                    for i, shop in enumerate(shops[:3]):
                        bbox = await shop.bounding_box()
                        if bbox:
                            print(f"店舗{i+1}の位置: height={bbox['height']}")
                else:
                    print("❌ 地図ボタンが見つかりません")
            else:
                print("❌ 詳細セクションが見つかりません")
            
            # エラーチェック
            if errors:
                print(f"\n❌ JavaScriptエラー: {len(errors)}件")
                for error in errors[:5]:
                    print(f"  {error['text']}")
            
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"❌ エラー: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_map_cta_issue())