#!/usr/bin/env python3
"""
詳細セクションのHTML内容を詳しく確認
"""

import asyncio
from playwright.async_api import async_playwright

class DetailSectionInspector:
    def __init__(self):
        self.base_url = "http://127.0.0.1:61338/injection-lipolysis001/"
        
    async def inspect_detail_section_html(self):
        """詳細セクションのHTML内容確認"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False, slow_mo=500)
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )
            page = await context.new_page()
            
            try:
                print("🔍 詳細セクションHTML内容確認")
                
                test_url = f"{self.base_url}?region_id=013"
                await page.goto(test_url)
                await page.wait_for_load_state('networkidle')
                await page.wait_for_timeout(5000)
                
                # 最初の詳細セクションの内容確認
                detail_items = await page.query_selector_all('.detail-item')
                if detail_items:
                    print(f"\n📊 詳細セクション数: {len(detail_items)}")
                    
                    # 最初のセクションの詳細確認
                    first_section = detail_items[0]
                    html_content = await first_section.inner_html()
                    
                    print(f"\n📍 最初の詳細セクションHTML:")
                    print("=" * 80)
                    print(html_content[:2000])  # 最初の2000文字
                    print("=" * 80)
                    
                    # 特定のキーワードを含む部分を検索
                    keywords = ['店舗', 'price', 'table', 'td', 'tr', '営業時間', '対応部位']
                    for keyword in keywords:
                        if keyword in html_content:
                            print(f"\n🔍 キーワード '{keyword}' 発見")
                            # キーワード周辺の200文字を表示
                            index = html_content.find(keyword)
                            start = max(0, index - 100)
                            end = min(len(html_content), index + 100)
                            print(f"  ...{html_content[start:end]}...")
                        else:
                            print(f"❌ キーワード '{keyword}' 見つからず")
                    
                    # テーブル要素の詳細確認
                    tables = await first_section.query_selector_all('table')
                    if tables:
                        print(f"\n📊 テーブル数: {len(tables)}")
                        for i, table in enumerate(tables):
                            table_html = await table.inner_html()
                            print(f"\n📋 テーブル {i+1} HTML:")
                            print(table_html[:1000])
                    
                else:
                    print("❌ 詳細セクションが見つかりません")
                
            except Exception as e:
                print(f"❌ エラー: {str(e)}")
                
            finally:
                await browser.close()

async def main():
    inspector = DetailSectionInspector()
    await inspector.inspect_detail_section_html()

if __name__ == "__main__":
    print("🔍 詳細セクションHTML内容確認ツール")
    print("=" * 50)
    asyncio.run(main())