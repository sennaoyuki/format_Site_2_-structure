#!/usr/bin/env python3
"""
cryolipolysisサイトの店舗表示機能テスト
"""

import asyncio
from playwright.async_api import async_playwright

async def test_cryolipolysis():
    """cryolipolysisサイトの動作確認"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # コンソールエラーをキャッチ
        errors = []
        page.on('console', lambda msg: errors.append({'type': msg.type, 'text': msg.text}) if msg.type in ['error', 'warning'] else None)
        page.on('pageerror', lambda error: errors.append({'type': 'page_error', 'text': str(error)}))
        
        try:
            print("🔍 cryolipolysisサイト店舗表示テスト")
            test_url = "http://localhost:8090/cryolipolysis/?region_id=013"
            print(f"アクセス中: {test_url}")
            
            response = await page.goto(test_url, wait_until='networkidle')
            print(f"Response status: {response.status}")
            
            await page.wait_for_timeout(3000)
            
            # エラーチェック
            print(f"\nJavaScriptエラー数: {len(errors)}")
            if errors:
                print("❌ JavaScriptエラーがあります:")
                for error in errors[:5]:  # 最初の5つを表示
                    print(f"  {error}")
            
            # 詳細セクションの確認
            detail_section = await page.query_selector('.clinic-details-section')
            if detail_section:
                print("✅ 詳細セクションが見つかりました")
                
                # brand-sectionの確認
                brand_sections = await page.query_selector_all('.brand-section')
                print(f"店舗セクション数: {len(brand_sections)}")
                
                if brand_sections:
                    for i, section in enumerate(brand_sections[:3]):
                        heading = await section.query_selector('.section-heading')
                        if heading:
                            text = await heading.inner_text()
                            print(f"  セクション {i+1}: {text}")
                        
                        shops = await section.query_selector_all('.shop')
                        print(f"    店舗数: {len(shops)}")
                else:
                    print("❌ 店舗セクションが見つかりません")
            else:
                print("❌ 詳細セクションが見つかりません")
            
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"❌ エラー: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_cryolipolysis())