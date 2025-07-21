const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // ローカルファイルを開く
    await page.goto(`file://${process.cwd()}/public/index.html`);
    
    // ページを完全に読み込むまで待つ
    await page.waitForLoadState('networkidle');
    
    // 比較表セクションを見つけて情報を取得
    const tableInfo = await page.evaluate(() => {
        const compareSection = document.querySelector('.comparison-section');
        const table = document.querySelector('.js-cbn-table');
        
        if (compareSection) {
            compareSection.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
        
        return {
            sectionOffset: compareSection?.offsetTop,
            tableExists: !!table,
            tableOffset: table?.offsetTop
        };
    });
    
    console.log('Table info:', tableInfo);
    
    // 少し待ってからスクリーンショット
    await page.waitForTimeout(1000);
    
    // 比較表の位置でスクリーンショットを撮る
    const screenshot = await page.screenshot({ 
        path: 'comparison-table-view.png',
        fullPage: true
    });
    
    console.log('Full page screenshot saved');
    
    // ブラウザを開いたままにして確認
    await page.waitForTimeout(5000);
    
    await browser.close();
})();