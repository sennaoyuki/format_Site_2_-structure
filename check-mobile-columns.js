const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Load local file in mobile view
    const filePath = `file://${path.resolve(__dirname, 'public/index.html')}`;
    console.log('Loading in mobile view...');
    
    // Set mobile viewport first
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(filePath);
    await page.waitForTimeout(2000);

    console.log('\n=== MOBILE VIEW COLUMN CHECK ===\n');
    
    // Check each tab
    const tabs = ['総合', '施術内容', 'サービス'];
    
    for (let i = 0; i < tabs.length; i++) {
      console.log(`\n${tabs[i]}タブ:`);
      
      // Click on tab
      await page.evaluate((index) => {
        const tabItems = document.querySelectorAll('.tab-menu-item');
        if (tabItems[index]) {
          tabItems[index].click();
        }
      }, i);
      
      await page.waitForTimeout(500);
      
      // Get visible columns
      const visibleColumns = await page.evaluate(() => {
        const headers = document.querySelectorAll('.js-cbn-table thead th');
        const visible = [];
        headers.forEach(th => {
          const style = window.getComputedStyle(th);
          const text = th.textContent.trim();
          if (style.display !== 'none') {
            visible.push({
              text: text,
              display: style.display
            });
          }
        });
        return visible;
      });
      
      console.log('表示されている列:');
      visibleColumns.forEach(col => {
        console.log(`  - ${col.text} (display: ${col.display})`);
      });
      
      // Check if "特典" is shown in tab1
      if (i === 0) {
        const hasBonus = visibleColumns.some(col => col.text === '特典');
        console.log(`\n  特典列の表示: ${hasBonus ? '✅ 表示されています' : '❌ 表示されていません'}`);
      }
    }
    
    // Check the actual HTML structure
    console.log('\n=== HTML構造の確認 ===');
    const thElements = await page.evaluate(() => {
      const headers = document.querySelectorAll('.js-cbn-table thead th');
      return Array.from(headers).map(th => ({
        text: th.textContent.trim(),
        className: th.className,
        inlineStyle: th.getAttribute('style') || 'なし'
      }));
    });
    
    console.log('\nすべての<th>要素:');
    thElements.forEach((th, index) => {
      console.log(`${index + 1}. "${th.text}"`);
      console.log(`   class: ${th.className || 'なし'}`);
      console.log(`   style: ${th.inlineStyle}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();