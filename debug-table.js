const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // テーブル内のすべてのth要素を取得して内容を確認
    const allHeaders = await page.$$eval('.js-cbn-table th', 
        els => els.map((el, index) => ({
            index: index,
            text: el.textContent.trim(),
            className: el.className,
            style: el.getAttribute('style') || '',
            computedDisplay: window.getComputedStyle(el).display
        }))
    );
    
    console.log('=== All Table Headers ===');
    allHeaders.forEach(header => {
        console.log(`[${header.index}] "${header.text}" | class="${header.className}" | style="${header.style}" | display="${header.computedDisplay}"`);
    });
    
    // タブ切り替え処理のコードを確認
    const tabColumnsMap = await page.evaluate(() => {
        const script = document.querySelector('script:not([src])');
        if (script) {
            const match = script.textContent.match(/const tabColumnsMap = ({[\s\S]*?});/);
            if (match) {
                return match[1];
            }
        }
        return 'Not found';
    });
    
    console.log('\n=== tabColumnsMap in page ===');
    console.log(tabColumnsMap);
    
    await browser.close();
})();