const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // ローカルファイルを開く
    await page.goto(`file://${process.cwd()}/public/index.html`);
    
    // 比較表セクションまでスクロール
    await page.evaluate(() => {
        const compareSection = document.querySelector('.comparison-section');
        if (compareSection) {
            compareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    
    // スクリーンショットを撮る
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: 'comparison-table-fixed.png',
        fullPage: false,
        clip: {
            x: 0,
            y: 300,
            width: 1200,
            height: 800
        }
    });
    
    console.log('Screenshot saved as comparison-table-fixed.png');
    
    // ブラウザを開いたままにして確認
    await page.waitForTimeout(10000);
    
    await browser.close();
})();