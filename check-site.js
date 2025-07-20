const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // サイトにアクセス
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    
    // 比較表セクションまでスクロール
    await page.evaluate(() => {
        document.querySelector('.comparison-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    // スクリーンショットを撮る
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: 'comparison-table-issue.png',
        fullPage: false,
        clip: {
            x: 0,
            y: 0,
            width: 1200,
            height: 800
        }
    });
    
    // 比較表の要素を調査
    const tableInfo = await page.evaluate(() => {
        const table = document.querySelector('.js-cbn-table table');
        const tbody = document.querySelector('#comparison-tbody');
        const firstRow = tbody?.querySelector('tr');
        
        return {
            tableWidth: table?.offsetWidth,
            tableHeight: table?.offsetHeight,
            tbodyChildCount: tbody?.children.length,
            firstRowHTML: firstRow?.innerHTML,
            firstCellInfo: {
                width: firstRow?.querySelector('td')?.offsetWidth,
                height: firstRow?.querySelector('td')?.offsetHeight,
                computedStyle: firstRow ? window.getComputedStyle(firstRow.querySelector('td')).cssText : null
            }
        };
    });
    
    console.log('Table Info:', JSON.stringify(tableInfo, null, 2));
    
    // 5秒待機して手動で確認できるようにする
    await page.waitForTimeout(5000);
    
    await browser.close();
})();