#!/usr/bin/env python3
"""
injection-lipolysis001の順位別リダイレクトをテスト
"""

import asyncio
from playwright.async_api import async_playwright

async def test_redirect_ranks():
    """各順位のリダイレクトをテスト"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        
        try:
            print("🔍 injection-lipolysis001 順位別リダイレクトテスト")
            
            # テストするクリニックと順位
            test_cases = [
                {'clinic_id': '1', 'name': 'ディオクリニック', 'code': 'dio'},
                {'clinic_id': '6', 'name': 'DSクリニック', 'code': 'dsc'},
                {'clinic_id': '2', 'name': 'エミナルクリニック', 'code': 'eminal'},
            ]
            
            for clinic in test_cases:
                print(f"\n{'='*60}")
                print(f"クリニック: {clinic['name']} (ID: {clinic['clinic_id']})")
                print('='*60)
                
                # 1位から5位までテスト
                for rank in range(1, 6):
                    redirect_url = f"http://localhost:8090/injection-lipolysis001/redirect.html?clinic_id={clinic['clinic_id']}&rank={rank}&region_id=056"
                    
                    print(f"\n--- {rank}位のテスト ---")
                    print(f"URL: {redirect_url}")
                    
                    # 新しいページでリダイレクトを開く
                    page = await context.new_page()
                    
                    # コンソールログをキャッチ
                    logs = []
                    page.on('console', lambda msg: logs.append({'type': msg.type, 'text': msg.text}))
                    
                    await page.goto(redirect_url, wait_until='domcontentloaded')
                    await page.wait_for_timeout(1500)
                    
                    # 重要なログを表示
                    for log in logs:
                        if 'URL取得情報' in log['text'] or 'URLフィールド名' in log['text'] or '取得したURL' in log['text'] or 'フォールバック' in log['text']:
                            print(f"  LOG: {log['text']}")
                    
                    # 手動リンクのURLを確認
                    manual_link = await page.query_selector('#manual-link')
                    if manual_link:
                        manual_href = await manual_link.get_attribute('href')
                        print(f"  手動リンクURL: {manual_href[:80]}...")
                        
                        # URLが正しく設定されているか確認
                        if manual_href and manual_href != '#':
                            print(f"  ✅ URLが設定されています")
                            
                            # param4が含まれているか確認
                            if 'param4=' in manual_href:
                                print(f"  ✅ param4が含まれています")
                            else:
                                print(f"  ❌ param4が含まれていません")
                        else:
                            print(f"  ❌ URLが設定されていません")
                    else:
                        print(f"  ❌ 手動リンクが見つかりません")
                    
                    # リダイレクトが発生したか確認
                    await page.wait_for_timeout(3000)
                    final_url = page.url
                    if final_url != redirect_url:
                        print(f"  ✅ リダイレクト成功")
                    else:
                        print(f"  ⚠️ リダイレクトされませんでした（テスト環境の制限）")
                    
                    await page.close()
            
            print("\n" + "="*60)
            print("テスト完了")
            print("="*60)
            
        except Exception as e:
            print(f"❌ エラー: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_redirect_ranks())