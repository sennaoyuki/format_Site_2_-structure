const { chromium, devices } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    
    // モバイルデバイスでテスト
    const deviceConfigs = [
        { name: 'iPhone 12', device: devices['iPhone 12'] },
        { name: 'iPhone SE', device: devices['iPhone SE'] },
        { name: 'Pixel 5', device: devices['Pixel 5'] }
    ];
    
    for (const config of deviceConfigs) {
        console.log(`Testing on ${config.name}...`);
        const context = await browser.newContext({
            ...config.device
        });
        
        const page = await context.newPage();
        await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
        
        // 比較表セクションまでスクロール
        await page.evaluate(() => {
            const section = document.querySelector('.comparison-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        await page.waitForTimeout(2000);
        
        // 横スクロールが必要かチェック
        const scrollInfo = await page.evaluate(() => {
            const table = document.querySelector('.js-cbn-table');
            const tableElement = document.querySelector('.js-cbn-table table');
            
            return {
                containerWidth: table?.offsetWidth,
                tableWidth: tableElement?.offsetWidth,
                needsHorizontalScroll: tableElement?.scrollWidth > table?.clientWidth,
                scrollWidth: tableElement?.scrollWidth,
                clientWidth: table?.clientWidth
            };
        });
        
        console.log(`${config.name} scroll info:`, scrollInfo);
        
        // スクリーンショット
        await page.screenshot({ 
            path: `mobile-${config.name.replace(/\s/g, '-')}.png`,
            fullPage: false
        });
        
        await context.close();
    }
    
    // デスクトップでも確認
    const desktopPage = await browser.newPage({
        viewport: { width: 1200, height: 800 }
    });
    
    await desktopPage.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    
    await desktopPage.evaluate(() => {
        document.querySelector('.comparison-section')?.scrollIntoView();
    });
    
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({ path: 'desktop-view.png' });
    
    console.log('\nScreenshots saved:');
    console.log('- mobile-iPhone-12.png');
    console.log('- mobile-iPhone-SE.png');
    console.log('- mobile-Pixel-5.png');
    console.log('- desktop-view.png');
    
    await browser.close();
})();