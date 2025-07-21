const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Load local file
    const filePath = `file://${path.resolve(__dirname, 'public/index.html')}`;
    console.log('Loading local file:', filePath);
    await page.goto(filePath);
    await page.waitForTimeout(2000);

    // Check tab structure
    const tabCount = await page.evaluate(() => {
      return document.querySelectorAll('.tabheader li').length;
    });
    console.log(`Number of tabs: ${tabCount}`);

    if (tabCount === 3) {
      console.log('✅ 3-tab structure confirmed!');
      
      // Get tab names
      const tabNames = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.tabheader li')).map(tab => tab.textContent.trim());
      });
      console.log('Tab names:', tabNames);

      // Test each tab
      for (let i = 0; i < tabNames.length; i++) {
        console.log(`\nTesting tab: ${tabNames[i]}`);
        await page.click(`.tabheader li:nth-child(${i + 1})`);
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
        console.log('Visible columns:', visibleColumns);
      }

      // Test mobile view
      console.log('\nTesting mobile view...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const tableWidth = await page.evaluate(() => {
        const table = document.querySelector('.js-cbn-table table');
        return table ? table.scrollWidth : 0;
      });
      
      const containerWidth = await page.evaluate(() => {
        const container = document.querySelector('.js-cbn-table');
        return container ? container.clientWidth : 0;
      });

      console.log(`\nMobile view - Table: ${tableWidth}px, Container: ${containerWidth}px`);
      console.log(`Horizontal scroll: ${tableWidth > containerWidth ? 'YES' : 'NO'}`);

      await page.screenshot({ path: 'local-test-mobile.png' });
      console.log('Mobile screenshot saved as local-test-mobile.png');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();