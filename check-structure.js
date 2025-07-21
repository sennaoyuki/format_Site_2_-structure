const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('Loading the website...');
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check if tabs exist
    const tabsExist = await page.locator('.tabheader').count();
    console.log('Tabs container exists:', tabsExist > 0);

    // Check tab items
    const tabItems = await page.locator('.tabheader li').count();
    console.log('Number of tab items:', tabItems);

    // Get all tab texts
    const tabTexts = await page.locator('.tabheader li').allTextContents();
    console.log('Tab texts:', tabTexts);

    // Check for active tab
    const activeTabCount = await page.locator('.tabheader li.active').count();
    console.log('Active tabs count:', activeTabCount);

    // Check table structure
    const tableExists = await page.locator('.js-cbn-table table').count();
    console.log('Table exists:', tableExists > 0);

    // Get all table headers
    const headers = await page.locator('.js-cbn-table thead th').allTextContents();
    console.log('All table headers:', headers);

    // Take a screenshot
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    console.log('Screenshot saved as current-state.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();