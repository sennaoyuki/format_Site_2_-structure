const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded' });
  } catch (error) {
    console.error('Failed to load page. Make sure the server is running on port 8080.');
    console.error('Start server with: python3 -m http.server 8080 --directory public');
    await browser.close();
    process.exit(1);
  }
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Wait for the table to load
  try {
    await page.waitForSelector('.js-cbn-table', { timeout: 5000 });
  } catch (error) {
    console.error('Table not found. Checking page content...');
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Has comparison section:', content.includes('comparison-section'));
    await browser.close();
    process.exit(1);
  }
  
  console.log('Testing mobile tab switching...\n');
  
  // Test all three tabs
  const tabs = [
    { selector: '[data-tab="tab1"]', name: '総合', expectedColumns: ['クリニック名', '総合評価', '実績', '特典', '公式サイト'] },
    { selector: '[data-tab="tab2"]', name: '施術内容', expectedColumns: ['クリニック名', '人気プラン', '医療機器', '注射治療', '公式サイト'] },
    { selector: '[data-tab="tab3"]', name: 'サービス', expectedColumns: ['クリニック名', '食事指導', 'モニター割', '返金保証', '公式サイト'] }
  ];
  
  for (const tab of tabs) {
    // Click the tab with force click to bypass any overlay issues
    await page.locator(tab.selector).click({ force: true });
    await page.waitForTimeout(500); // Wait for animation
    
    // Get visible columns
    const visibleColumns = await page.evaluate(() => {
      const headers = document.querySelectorAll('.js-cbn-table th');
      const visible = [];
      headers.forEach(th => {
        if (getComputedStyle(th).display !== 'none') {
          visible.push(th.textContent.trim());
        }
      });
      return visible;
    });
    
    console.log(`Tab: ${tab.name}`);
    console.log(`Expected columns: ${tab.expectedColumns.join(', ')}`);
    console.log(`Actual columns: ${visibleColumns.join(', ')}`);
    
    // Check if columns match
    const matches = JSON.stringify(tab.expectedColumns) === JSON.stringify(visibleColumns);
    console.log(`Result: ${matches ? '✅ PASS' : '❌ FAIL'}`);
    
    // Check first data row visibility
    const firstRowData = await page.evaluate(() => {
      const firstRow = document.querySelector('.js-cbn-table tbody tr');
      if (!firstRow) return null;
      
      const cells = firstRow.querySelectorAll('td');
      const visibleCells = [];
      cells.forEach((td, index) => {
        if (getComputedStyle(td).display !== 'none') {
          visibleCells.push({
            index: index,
            hasContent: td.textContent.trim().length > 0
          });
        }
      });
      return visibleCells;
    });
    
    console.log(`Visible cells in first row: ${firstRowData ? firstRowData.length : 0}`);
    console.log('---\n');
  }
  
  // Test desktop view
  console.log('Testing desktop view...\n');
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(500); // Wait for resize handler
  
  // Check tab2 in desktop mode
  await page.click('[data-tab="tab2"]');
  await page.waitForTimeout(500);
  
  const desktopColumns = await page.evaluate(() => {
    const headers = document.querySelectorAll('.js-cbn-table th');
    const visible = [];
    headers.forEach(th => {
      if (getComputedStyle(th).display !== 'none') {
        visible.push(th.textContent.trim());
      }
    });
    return visible;
  });
  
  console.log('Desktop Tab2 columns:', desktopColumns.join(', '));
  console.log('Expected: クリニック名, 人気プラン, 医療機器, 注射治療, 公式サイト');
  
  await browser.close();
  console.log('\nTest completed!');
})();