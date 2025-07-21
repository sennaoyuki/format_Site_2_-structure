const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    
    console.log('Testing 768px viewport...\n');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Tab 1
    console.log('=== Tab 1 (総合) ===');
    const tab1Headers = await page.$$eval('.js-cbn-table th:not([style*="display: none"])', 
        els => els.map(el => el.textContent.trim())
    );
    console.log('Visible columns:', tab1Headers);
    console.log('Column count:', tab1Headers.length);
    
    // Check if any CSS is hiding columns
    const tab1ThStyles = await page.$$eval('.js-cbn-table th', 
        els => els.map(el => ({
            text: el.textContent.trim(),
            display: window.getComputedStyle(el).display,
            visibility: window.getComputedStyle(el).visibility
        }))
    );
    console.log('\nAll th elements with computed styles:');
    tab1ThStyles.forEach((th, i) => {
        console.log(`  ${i}: "${th.text}" - display: ${th.display}, visibility: ${th.visibility}`);
    });
    
    await browser.close();
})();