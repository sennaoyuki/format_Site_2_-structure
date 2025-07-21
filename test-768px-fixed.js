const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        // キャッシュを無効化
        bypassCSP: true
    });
    const page = await context.newPage();
    
    console.log('Testing 768px viewport with cache bypass...\n');
    
    // キャッシュバスターを追加
    await page.goto('http://localhost:3000/index.html?t=' + Date.now());
    await page.waitForLoadState('networkidle');
    
    // 強制リロード
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Tab 1
    console.log('=== Tab 1 (総合) ===');
    const tab1Headers = await page.$$eval('.js-cbn-table th:not([style*="display: none"])', 
        els => els.map(el => el.textContent.trim())
    );
    console.log('Visible columns:', tab1Headers);
    console.log('Column count:', tab1Headers.length);
    console.log('Expected: クリニック, 総合評価, 実績, 特典, 公式サイト');
    
    if (tab1Headers.length === 5 && tab1Headers[4] === '公式サイト') {
        console.log('✅ SUCCESS: 公式サイトが正しく表示されています');
    } else {
        console.log('❌ ERROR: 公式サイトが表示されていません');
    }
    
    await browser.close();
})();