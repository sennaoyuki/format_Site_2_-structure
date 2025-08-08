#!/usr/bin/env python3
"""
DSCロゴの404エラー修正テスト
"""

import asyncio
from playwright.async_api import async_playwright

async def test_dsc_logo():
    """DSCロゴが正しく表示されるかテスト"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # 404エラーをキャッチ
        errors = []
        page.on('console', lambda msg: errors.append({'type': msg.type, 'text': msg.text}))
        page.on('pageerror', lambda error: errors.append({'type': 'page_error', 'text': str(error)}))
        
        try:
            print("🔍 DSCロゴエラー修正テスト")
            test_url = "http://localhost:8090/injection-lipolysis001/?region_id=056&gclid=test&utm_creative=test&max_scroll=100&detail_click=%E3%83%87%E3%82%A3%E3%82%AA%E3%82%AF%E3%83%AA%E3%83%8B%E3%83%83%E3%82%AF&detail_rank=1#clinic1"
            print(f"アクセス中: {test_url}")
            
            response = await page.goto(test_url, wait_until='commit')
            print(f"Response status: {response.status}")
            
            await page.wait_for_timeout(3000)
            
            # DSCロゴの404エラーをチェック
            dsc_logo_errors = [e for e in errors if 'dsc-logo.webp' in e.get('text', '')]
            print(f"\\nDSCロゴ404エラー数: {len(dsc_logo_errors)}")
            
            if dsc_logo_errors:
                print("❌ まだDSCロゴの404エラーがあります:")
                for error in dsc_logo_errors:
                    print(f"  {error}")
            else:
                print("✅ DSCロゴの404エラーは修正されました")
            
            # 全体のエラー数もチェック
            total_errors = len([e for e in errors if e['type'] in ['error', 'page_error']])
            print(f"\\n全体エラー数: {total_errors}")
            
            # DSクリニックの店舗セクションを確認
            try:
                dsc_section = await page.query_selector('[data-clinic-id="6"]')  # DSクリニックはID6
                if dsc_section:
                    brand_section = await dsc_section.query_selector('.brand-section')
                    if brand_section:
                        shops = await brand_section.query_selector_all('.shop')
                        print(f"DSクリニック店舗数: {len(shops)}")
                        
                        for shop in shops:
                            img = await shop.query_selector('.shop-image img')
                            if img:
                                src = await img.get_attribute('src')
                                print(f"  店舗画像: {src}")
                    else:
                        print("❌ DSクリニックのbrand-sectionが見つかりません")
                else:
                    print("❌ DSクリニック詳細セクションが見つかりません")
            except Exception as e:
                print(f"DSクリニックセクション確認エラー: {str(e)}")
            
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"❌ エラー: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_dsc_logo())