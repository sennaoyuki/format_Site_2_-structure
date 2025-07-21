const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Testing live site mobile view...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Load live site
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check if tabs exist
    const tabsExist = await page.evaluate(() => {
      return document.querySelectorAll('.tab-menu-item').length;
    });

    if (tabsExist === 3) {
      console.log('✅ 3 tabs found on live site\n');
      
      // Test each tab
      const tabs = ['総合', '施術内容', 'サービス'];
      
      for (let i = 0; i < tabs.length; i++) {
        console.log(`\nTesting "${tabs[i]}" tab:`);
        
        // Click tab
        await page.click(`.tab-menu-item:nth-child(${i + 1})`);
        await page.waitForTimeout(1000);
        
        // Get visible columns
        const visibleColumns = await page.evaluate(() => {
          const headers = document.querySelectorAll('.js-cbn-table thead th');
          const visible = [];
          headers.forEach(th => {
            if (getComputedStyle(th).display !== 'none') {
              visible.push(th.textContent.trim());
            }
          });
          return visible;
        });
        
        console.log('Visible columns:', visibleColumns.join(', '));
        
        // Take screenshot
        await page.screenshot({ path: `live-mobile-tab${i + 1}.png` });
      }
      
      console.log('\n✅ Screenshots saved as live-mobile-tab1.png, live-mobile-tab2.png, live-mobile-tab3.png');
    } else {
      console.log(`❌ Expected 3 tabs but found ${tabsExist}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();