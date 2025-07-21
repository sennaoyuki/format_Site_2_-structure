const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Testing mobile 375px viewport with 5 columns...\n');
    
    // Take initial screenshot
    await page.screenshot({ path: 'mobile-375px-tab1.png' });
    
    // Test Tab 1 (総合) - Default view
    console.log('=== Tab 1 (総合) - Default view ===');
    await page.waitForSelector('.js-cbn-table table', { timeout: 10000 });
    
    const tab1Headers = await page.$$eval('.js-cbn-table th:not([style*="display: none"])', 
        els => els.map(el => el.textContent.trim())
    );
    
    console.log('Visible columns:', tab1Headers);
    console.log('Column count:', tab1Headers.length);
    console.log('Expected 5: クリニック, 総合評価, 実績, 特典, 公式サイト');
    console.log('✅ Tab 1 passed:', tab1Headers.length === 5 ? 'YES' : 'NO');
    console.log('');
    
    // Test Tab 2 (施術内容)
    console.log('=== Tab 2 (施術内容) ===');
    await page.click('[data-tab="tab2"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile-375px-tab2.png' });
    
    const tab2Headers = await page.$$eval('.js-cbn-table th:not([style*="display: none"])', 
        els => els.map(el => el.textContent.trim())
    );
    
    console.log('Visible columns:', tab2Headers);
    console.log('Column count:', tab2Headers.length);
    console.log('Expected 5: クリニック, 人気プラン, 医療機器, 注射治療, 公式サイト');
    console.log('✅ Tab 2 passed:', tab2Headers.length === 5 ? 'YES' : 'NO');
    console.log('');
    
    // Test Tab 3 (サービス)
    console.log('=== Tab 3 (サービス) ===');
    await page.click('[data-tab="tab3"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile-375px-tab3.png' });
    
    const tab3Headers = await page.$$eval('.js-cbn-table th:not([style*="display: none"])', 
        els => els.map(el => el.textContent.trim())
    );
    
    console.log('Visible columns:', tab3Headers);
    console.log('Column count:', tab3Headers.length);
    console.log('Expected 5: クリニック, 食事指導, モニター割引, 全額返金保証, 公式サイト');
    console.log('✅ Tab 3 passed:', tab3Headers.length === 5 ? 'YES' : 'NO');
    console.log('');
    
    // Final result
    const allPassed = tab1Headers.length === 5 && tab2Headers.length === 5 && tab3Headers.length === 5;
    
    console.log('=== FINAL RESULT ===');
    if (allPassed) {
        console.log('🎉 SUCCESS: All tabs show exactly 5 columns on mobile (375px)!');
        console.log('Tab 1: ✅ 5 columns');
        console.log('Tab 2: ✅ 5 columns');
        console.log('Tab 3: ✅ 5 columns');
    } else {
        console.log('❌ FAIL: Not all tabs show 5 columns');
        console.log(`Tab 1: ${tab1Headers.length === 5 ? '✅' : '❌'} ${tab1Headers.length} columns`);
        console.log(`Tab 2: ${tab2Headers.length === 5 ? '✅' : '❌'} ${tab2Headers.length} columns`);
        console.log(`Tab 3: ${tab3Headers.length === 5 ? '✅' : '❌'} ${tab3Headers.length} columns`);
    }
    
    await browser.close();
})();