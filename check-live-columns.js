const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Checking live site column visibility...\n');
    
    // Load live site in mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Scroll to comparison table
    await page.evaluate(() => {
      const table = document.querySelector('.js-cbn-table');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(1000);

    // Check initial state (Tab 1)
    console.log('Initial state (総合 tab):');
    let visibleColumns = await page.evaluate(() => {
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

    // Try clicking tabs using JavaScript
    console.log('\nSwitching to 施術内容 tab...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab-menu-item');
      if (tabs[1]) {
        tabs[1].click();
      }
    });
    await page.waitForTimeout(1000);

    visibleColumns = await page.evaluate(() => {
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

    // Switch to tab 3
    console.log('\nSwitching to サービス tab...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab-menu-item');
      if (tabs[2]) {
        tabs[2].click();
      }
    });
    await page.waitForTimeout(1000);

    visibleColumns = await page.evaluate(() => {
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

    // Take screenshot of current state
    await page.screenshot({ path: 'live-site-mobile-current.png', fullPage: false });
    console.log('\n✅ Screenshot saved as live-site-mobile-current.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();