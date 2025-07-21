const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('1. Loading the website...');
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check initial state
    console.log('\n2. Checking initial state (総合 tab)...');
    const activeTab = await page.locator('.tabheader li.active').textContent();
    console.log('Active tab:', activeTab);

    // Check visible columns for 総合 tab
    const visibleHeaders = await page.locator('.js-cbn-table thead th:visible').allTextContents();
    console.log('Visible columns:', visibleHeaders);

    // Test tab switching to 施術内容
    console.log('\n3. Switching to 施術内容 tab...');
    await page.click('text=施術内容');
    await page.waitForTimeout(1000);

    const activeTab2 = await page.locator('.tabheader li.active').textContent();
    console.log('Active tab:', activeTab2);

    const visibleHeaders2 = await page.locator('.js-cbn-table thead th:visible').allTextContents();
    console.log('Visible columns:', visibleHeaders2);

    // Test tab switching to サービス
    console.log('\n4. Switching to サービス tab...');
    await page.click('text=サービス');
    await page.waitForTimeout(1000);

    const activeTab3 = await page.locator('.tabheader li.active').textContent();
    console.log('Active tab:', activeTab3);

    const visibleHeaders3 = await page.locator('.js-cbn-table thead th:visible').allTextContents();
    console.log('Visible columns:', visibleHeaders3);

    // Test mobile view
    console.log('\n5. Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check if horizontal scroll exists
    const tableWidth = await page.evaluate(() => {
      const table = document.querySelector('.js-cbn-table table');
      return table ? table.scrollWidth : 0;
    });
    
    const containerWidth = await page.evaluate(() => {
      const container = document.querySelector('.js-cbn-table');
      return container ? container.clientWidth : 0;
    });

    console.log(`Table width: ${tableWidth}px, Container width: ${containerWidth}px`);
    console.log(`Horizontal scroll: ${tableWidth > containerWidth ? 'YES' : 'NO'}`);

    // Test mobile tab switching
    console.log('\n6. Testing tab switching on mobile...');
    await page.click('text=総合');
    await page.waitForTimeout(500);
    const mobileHeaders1 = await page.locator('.js-cbn-table thead th:visible').allTextContents();
    console.log('総合 mobile columns:', mobileHeaders1);

    await page.click('text=施術内容');
    await page.waitForTimeout(500);
    const mobileHeaders2 = await page.locator('.js-cbn-table thead th:visible').allTextContents();
    console.log('施術内容 mobile columns:', mobileHeaders2);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
})();