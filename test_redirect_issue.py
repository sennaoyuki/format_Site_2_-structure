#!/usr/bin/env python3
"""
injection-lipolysis001のリダイレクト問題をテスト
"""

import asyncio
from playwright.async_api import async_playwright

async def test_redirect_links():
    """各クリニックのリダイレクトリンクをテスト"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # コンソールログをキャッチ
        logs = []
        page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text}))
        
        try:
            print("🔍 injection-lipolysis001 リダイレクトリンクテスト")
            
            # まずメインページにアクセス
            test_url = "http://localhost:8090/injection-lipolysis001/?region_id=056"
            print(f"アクセス中: {test_url}")
            
            response = await page.goto(test_url, wait_until='networkidle')
            print(f"Response status: {response.status}")
            
            await page.wait_for_timeout(3000)
            
            # 各クリニックのCTAボタンを確認
            clinics_to_test = [
                {'id': '1', 'name': 'ディオクリニック'},
                {'id': '6', 'name': 'DSクリニック'},
                {'id': '2', 'name': 'エミナルクリニック'},
                {'id': '5', 'name': '湘南美容クリニック'}
            ]
            
            for clinic in clinics_to_test:
                print(f"\n--- {clinic['name']} のテスト ---")
                
                # 詳細セクションを探す
                detail_section = await page.query_selector(f'[data-clinic-id="{clinic["id"]}"]')
                if detail_section:
                    print(f"✅ {clinic['name']}詳細セクションが見つかりました")
                    
                    # CTAボタンを探す
                    cta_button = await detail_section.query_selector('.btn_second_primary a')
                    if cta_button:
                        href = await cta_button.get_attribute('href')
                        print(f"CTAボタンのURL: {href}")
                        
                        # URLを解析
                        if 'redirect.html' in href:
                            # URLパラメータを抽出
                            url_parts = href.split('?')
                            if len(url_parts) > 1:
                                params = url_parts[1].split('&')
                                for param in params:
                                    if '=' in param:
                                        key, value = param.split('=', 1)
                                        if key in ['clinic_id', 'rank']:
                                            print(f"  {key}: {value}")
                        else:
                            print("❌ redirect.htmlが含まれていません")
                    else:
                        print(f"❌ {clinic['name']}のCTAボタンが見つかりません")
                else:
                    print(f"❌ {clinic['name']}詳細セクションが見つかりません")
            
            # リダイレクトページの直接テスト
            print("\n--- リダイレクトページの直接テスト ---")
            for clinic in clinics_to_test:
                redirect_url = f"http://localhost:8090/injection-lipolysis001/redirect.html?clinic_id={clinic['id']}&rank=1&region_id=056"
                print(f"\nテスト: {clinic['name']}")
                print(f"URL: {redirect_url}")
                
                # 新しいページでリダイレクトを開く
                redirect_page = await context.new_page()
                
                # リダイレクトページのコンソールログをキャッチ
                redirect_logs = []
                redirect_page.on('console', lambda msg: redirect_logs.append({'type': msg.type, 'text': msg.text}))
                
                await redirect_page.goto(redirect_url, wait_until='domcontentloaded')
                await redirect_page.wait_for_timeout(1000)
                
                # コンソールログを確認
                for log in redirect_logs:
                    if log['type'] in ['log', 'error', 'warning']:
                        print(f"  [{log['type']}] {log['text']}")
                
                # リダイレクト先を確認
                final_url = redirect_page.url
                if final_url != redirect_url:
                    print(f"  ✅ リダイレクト成功: {final_url}")
                else:
                    print(f"  ❌ リダイレクトされませんでした")
                    
                    # 手動リンクを確認
                    manual_link = await redirect_page.query_selector('#manual-link')
                    if manual_link:
                        manual_href = await manual_link.get_attribute('href')
                        print(f"  手動リンク: {manual_href}")
                
                await redirect_page.close()
            
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"❌ エラー: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_redirect_links())