const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Load local file
    const filePath = `file://${path.resolve(__dirname, 'public/index.html')}`;
    console.log('Loading local implementation...');
    await page.goto(filePath);
    await page.waitForTimeout(3000);

    // Check tab count
    const tabInfo = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab-menu-item');
      return {
        count: tabs.length,
        names: Array.from(tabs).map(t => t.textContent.trim()),
        hasActiveTab: document.querySelector('.tab-active') !== null
      };
    });

    console.log('\n✅ TAB IMPLEMENTATION:');
    console.log(`  - Number of tabs: ${tabInfo.count}`);
    console.log(`  - Tab names: ${tabInfo.names.join(', ')}`);
    console.log(`  - Has active tab: ${tabInfo.hasActiveTab}`);

    // Check visible columns in initial state
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
    console.log(`  - Initial visible columns: ${visibleColumns.join(', ')}`);

    // Take screenshots
    console.log('\n📸 TAKING SCREENSHOTS:');
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: 'implementation-desktop.png', fullPage: false });
    console.log('  - Desktop view saved');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'implementation-mobile.png', fullPage: false });
    console.log('  - Mobile view saved');

    // Check live site
    console.log('\n🌐 CHECKING LIVE SITE:');
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const liveTabInfo = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab-menu-item');
      return {
        count: tabs.length,
        names: tabs.length > 0 ? Array.from(tabs).map(t => t.textContent.trim()) : []
      };
    });

    if (liveTabInfo.count === 3) {
      console.log(`  ✅ Live site updated! Tabs: ${liveTabInfo.names.join(', ')}`);
    } else {
      console.log(`  ⏳ Live site shows ${liveTabInfo.count} tabs. Deployment may be pending.`);
    }

    console.log('\n✅ Check complete! Review the screenshots to verify the implementation.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();