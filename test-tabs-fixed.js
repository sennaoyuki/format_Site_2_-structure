const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    
    // 現在のサイトのタブ切り替えをテスト
    const page1 = await browser.newPage();
    await page1.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    
    // 比較表セクションの位置を取得
    const tablePosition = await page1.evaluate(() => {
        const section = document.querySelector('.comparison-section');
        const table = document.querySelector('.js-cbn-table');
        return {
            sectionTop: section?.offsetTop || 0,
            tableTop: table?.offsetTop || 0
        };
    });
    
    console.log('Table position:', tablePosition);
    
    // 比較表の少し上にスクロール（タブメニューが見えるように）
    await page1.evaluate((top) => {
        window.scrollTo({ top: top - 100, behavior: 'smooth' });
    }, tablePosition.sectionTop);
    
    await page1.waitForTimeout(2000);
    
    // 初期状態のスクリーンショット
    await page1.screenshot({ 
        path: 'tab-0-initial.png',
        fullPage: false
    });
    
    // タブメニューの情報を取得
    const tabInfo = await page1.evaluate(() => {
        const tabs = document.querySelectorAll('.tab-menu-item');
        return Array.from(tabs).map(tab => ({
            text: tab.textContent,
            dataTab: tab.getAttribute('data-tab'),
            isActive: tab.classList.contains('tab-active')
        }));
    });
    
    console.log('Tab info:', tabInfo);
    
    // 各タブをクリック
    for (let i = 0; i < tabInfo.length; i++) {
        const tab = tabInfo[i];
        console.log(`Clicking tab ${i+1}: ${tab.text} (${tab.dataTab})`);
        
        try {
            // data-tab属性を使ってタブをクリック
            await page1.click(`[data-tab="${tab.dataTab}"]`);
            await page1.waitForTimeout(1000);
            
            // スクリーンショット
            await page1.screenshot({ 
                path: `tab-${i+1}-${tab.text}.png`,
                fullPage: false
            });
            
            // 表示される列の情報を取得
            const columnInfo = await page1.evaluate(() => {
                const visibleHeaders = Array.from(document.querySelectorAll('.js-cbn-table th')).filter(th => 
                    getComputedStyle(th).display !== 'none'
                );
                return visibleHeaders.map(th => th.textContent.trim());
            });
            
            console.log(`Visible columns for ${tab.text}:`, columnInfo);
            
        } catch (error) {
            console.error(`Failed to click tab ${tab.text}:`, error.message);
        }
    }
    
    // 理想のサイトも確認
    console.log('\nChecking ideal layout site...');
    const page2 = await browser.newPage();
    await page2.goto('https://datsumo-osusume-guide.com/ranking001/?undefined=undefined', { waitUntil: 'networkidle' });
    
    await page2.waitForTimeout(2000);
    
    // 理想のサイトのタブ切り替え部分を探す
    const idealTabInfo = await page2.evaluate(() => {
        // タブメニューを探す
        const tabElements = document.querySelectorAll('.tab-menu-item, .tab-button, [class*="tab"]');
        return Array.from(tabElements).slice(0, 10).map(el => ({
            class: el.className,
            text: el.textContent?.trim(),
            tag: el.tagName
        }));
    });
    
    console.log('Ideal site tab elements:', idealTabInfo);
    
    // 理想のサイトのスクリーンショット
    await page2.screenshot({ 
        path: 'ideal-layout-full.png',
        fullPage: false
    });
    
    console.log('\nScreenshots saved');
    console.log('Check the following files:');
    console.log('- tab-0-initial.png (初期状態)');
    console.log('- tab-1-総合.png');
    console.log('- tab-2-プラン.png');
    console.log('- tab-3-機器.png');
    console.log('- tab-4-サービス.png');
    console.log('- ideal-layout-full.png (理想のレイアウト)');
    
    // ブラウザを開いたままにして確認
    await page1.waitForTimeout(10000);
    
    await browser.close();
})();