const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // DevToolsを開く
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールログを出力
  page.on('console', msg => {
    console.log(`[Console ${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('ページを開いています...');
    await page.goto('http://localhost:8080/index.html?region_id=013');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n=== 詳細を見るボタンを探しています ===');
    
    // すべての詳細を見るリンクを探す
    const detailLinks = await page.$$('a:has-text("詳細を見る")');
    console.log(`見つかった「詳細を見る」リンクの数: ${detailLinks.length}`);
    
    // 各リンクの情報を取得
    for (let i = 0; i < detailLinks.length; i++) {
      const link = detailLinks[i];
      const href = await link.getAttribute('href');
      const className = await link.getAttribute('class');
      const parentClass = await link.evaluate(el => el.parentElement?.className);
      
      console.log(`\nリンク ${i + 1}:`);
      console.log(`  href: ${href}`);
      console.log(`  class: ${className}`);
      console.log(`  parent class: ${parentClass}`);
    }
    
    // detail-scroll-linkクラスのリンクを確認
    const scrollLinks = await page.$$('.detail-scroll-link');
    console.log(`\n.detail-scroll-linkクラスのリンク数: ${scrollLinks.length}`);
    
    if (detailLinks.length > 0) {
      console.log('\n=== 最初の詳細を見るボタンをクリックします ===');
      
      // クリック前のスクロール位置を記録
      const scrollBefore = await page.evaluate(() => window.pageYOffset);
      console.log(`クリック前のスクロール位置: ${scrollBefore}`);
      
      // 最初のリンクをクリック
      await detailLinks[0].click();
      
      // 少し待機
      await page.waitForTimeout(2000);
      
      // クリック後のスクロール位置を確認
      const scrollAfter = await page.evaluate(() => window.pageYOffset);
      console.log(`クリック後のスクロール位置: ${scrollAfter}`);
      console.log(`スクロールした距離: ${scrollAfter - scrollBefore}px`);
      
      // 現在表示されている要素を確認
      const visibleElement = await page.evaluate(() => {
        const elements = document.querySelectorAll('[id^="clinic-detail-"]');
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight) {
            return {
              id: el.id,
              top: rect.top,
              rank: el.getAttribute('data-rank')
            };
          }
        }
        return null;
      });
      
      if (visibleElement) {
        console.log(`\n現在表示されている詳細セクション:`, visibleElement);
      }
    }
    
    console.log('\n=== コンソールログを確認するため30秒待機します ===');
    console.log('ブラウザのDevToolsでConsoleタブを確認してください');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await browser.close();
  }
})();