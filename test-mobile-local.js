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
        // ローカルファイルを開く
        await page.goto(`file://${process.cwd()}/public/index.html`);
        
        // ページ読み込み待機
        await page.waitForLoadState('networkidle');
        
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
            
            // 現在のスタイル情報も取得
            const computedStyle = window.getComputedStyle(table);
            const tableStyle = window.getComputedStyle(tableElement);
            
            return {
                containerWidth: table?.offsetWidth,
                tableWidth: tableElement?.offsetWidth,
                needsHorizontalScroll: tableElement?.scrollWidth > table?.clientWidth,
                scrollWidth: tableElement?.scrollWidth,
                clientWidth: table?.clientWidth,
                overflow: computedStyle.overflowX,
                tableMinWidth: tableStyle.minWidth,
                windowWidth: window.innerWidth
            };
        });
        
        console.log(`${config.name} scroll info:`, scrollInfo);
        
        // スクリーンショット
        await page.screenshot({ 
            path: `mobile-local-${config.name.replace(/\s/g, '-')}.png`,
            fullPage: false
        });
        
        // タブ切り替えもテスト
        if (config.name === 'iPhone 12') {
            console.log('Testing tab switching on iPhone 12...');
            
            // プランタブをクリック
            await page.click('[data-tab="tab2"]');
            await page.waitForTimeout(1000);
            
            const planScrollInfo = await page.evaluate(() => {
                const table = document.querySelector('.js-cbn-table');
                const tableElement = document.querySelector('.js-cbn-table table');
                
                return {
                    needsHorizontalScroll: tableElement?.scrollWidth > table?.clientWidth,
                    visibleColumns: Array.from(document.querySelectorAll('.js-cbn-table th'))
                        .filter(th => window.getComputedStyle(th).display !== 'none')
                        .map(th => th.textContent.trim())
                };
            });
            
            console.log('Plan tab info:', planScrollInfo);
            
            await page.screenshot({ 
                path: 'mobile-local-iPhone-12-plan-tab.png',
                fullPage: false
            });
        }
        
        await context.close();
    }
    
    console.log('\nLocal test screenshots saved');
    
    await browser.close();
})();