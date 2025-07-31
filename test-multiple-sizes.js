const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    // テストするサイズ一覧
    const testSizes = [
        { name: 'iPhone SE (375px)', width: 375, height: 667 },
        { name: 'iPhone 14 Pro Max (430px)', width: 430, height: 932 },
        { name: 'iPhone 12/13 (390px)', width: 390, height: 844 },
        { name: 'Pixel 5 (393px)', width: 393, height: 851 },
        { name: 'Galaxy S20 (412px)', width: 412, height: 915 }
    ];
    
    for (const size of testSizes) {
        console.log(`\n========== ${size.name} テスト ==========`);
        
        const context = await browser.newContext({
            viewport: { width: size.width, height: size.height },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        });
        
        const page = await context.newPage();
        
        await page.goto('http://localhost:8090/draft/?region_id=013', {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(3000);
        
        // 手動初期化
        await page.evaluate(() => {
            if (typeof initCaseSlider === 'function') {
                initCaseSlider();
            }
        });
        
        await page.waitForTimeout(1000);
        
        // 画像サイズ情報を取得
        const imageInfo = await page.evaluate(() => {
            const img = document.querySelector('.case-slider img');
            if (!img) return null;
            
            return {
                displaySize: `${img.offsetWidth}x${img.offsetHeight}`,
                computedWidth: window.getComputedStyle(img).width,
                viewportWidth: window.innerWidth,
                expectedWidth: window.innerWidth - 52 // calc(100vw - 52px)
            };
        });
        
        console.log('📊 画像情報:', imageInfo);
        
        // CASEセクションまでスクロール
        await page.evaluate(() => {
            const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            caseH4?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        await page.waitForTimeout(500);
        
        // スクリーンショット撮影
        const caseSection = await page.evaluateHandle(() => {
            const h4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            return h4?.closest('.clinic-points-section');
        });
        
        if (caseSection) {
            const filename = `sp-case-${size.width}px.png`;
            await caseSection.screenshot({ path: filename });
            console.log(`📷 スクリーンショット: ${filename}`);
        }
        
        await context.close();
    }
    
    console.log('\n✅ すべてのテスト完了');
    await browser.close();
})();