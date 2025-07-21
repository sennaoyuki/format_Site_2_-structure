const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test local implementation first
    console.log('=== TESTING LOCAL IMPLEMENTATION ===\n');
    const filePath = `file://${path.resolve(__dirname, 'public/index.html')}`;
    await page.goto(filePath);
    await page.waitForTimeout(2000);

    // Check tab structure
    const tabCount = await page.evaluate(() => {
      return document.querySelectorAll('.tab-menu-item').length;
    });
    console.log(`✅ Number of tabs: ${tabCount}`);

    if (tabCount === 3) {
      // Get tab names
      const tabNames = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.tab-menu-item')).map(tab => tab.textContent.trim());
      });
      console.log('✅ Tab names:', tabNames);

      // Test each tab on desktop
      console.log('\n📱 DESKTOP VIEW TESTS:');
      await page.setViewportSize({ width: 1280, height: 800 });
      
      for (let i = 0; i < tabNames.length; i++) {
        console.log(`\nTesting "${tabNames[i]}" tab:`);
        await page.click(`.tab-menu-item:nth-child(${i + 1})`);
        await page.waitForTimeout(500);

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
        console.log('  Visible columns:', visibleColumns);
      }

      // Test mobile view
      console.log('\n📱 MOBILE VIEW TESTS:');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Check each tab on mobile
      for (let i = 0; i < tabNames.length; i++) {
        console.log(`\nTesting "${tabNames[i]}" tab on mobile:`);
        await page.click(`.tab-menu-item:nth-child(${i + 1})`);
        await page.waitForTimeout(500);

        const mobileColumns = await page.evaluate(() => {
          const headers = document.querySelectorAll('.js-cbn-table thead th');
          const visible = [];
          headers.forEach(th => {
            if (getComputedStyle(th).display !== 'none') {
              visible.push(th.textContent.trim());
            }
          });
          return visible;
        });
        console.log('  Mobile columns:', mobileColumns);
      }

      // Check horizontal scroll
      const tableWidth = await page.evaluate(() => {
        const table = document.querySelector('.js-cbn-table table');
        return table ? table.scrollWidth : 0;
      });
      
      const containerWidth = await page.evaluate(() => {
        const container = document.querySelector('.js-cbn-table');
        return container ? container.clientWidth : 0;
      });

      console.log(`\n📏 Mobile scroll check:`);
      console.log(`  Table width: ${tableWidth}px`);
      console.log(`  Container width: ${containerWidth}px`);
      console.log(`  Horizontal scroll: ${tableWidth > containerWidth ? '❌ YES (needs fixing)' : '✅ NO (perfect!)'}`);

      // Take screenshots
      await page.screenshot({ path: 'final-test-mobile.png' });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.screenshot({ path: 'final-test-desktop.png' });
      
      console.log('\n✅ Screenshots saved: final-test-mobile.png, final-test-desktop.png');
    }

    // Now check the live site
    console.log('\n\n=== CHECKING LIVE SITE ===\n');
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const liveTabCount = await page.evaluate(() => {
      return document.querySelectorAll('.tab-menu-item').length;
    });

    if (liveTabCount === 3) {
      console.log('✅ Live site has been updated with 3-tab structure!');
    } else {
      console.log('⏳ Live site not updated yet. Deployment may still be in progress.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();