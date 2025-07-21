const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    
    // 現在のサイトのタブ切り替えをテスト
    const page1 = await browser.newPage();
    await page1.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'networkidle' });
    
    // 比較表セクションまでスクロール
    await page1.evaluate(() => {
        document.querySelector('.comparison-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    await page1.waitForTimeout(2000);
    
    // 各タブをクリックしてスクリーンショットを撮る
    const tabs = ['総合', 'プラン', '機器', 'サービス'];
    
    for (let i = 0; i < tabs.length; i++) {
        console.log(`Clicking tab: ${tabs[i]}`);
        
        // タブをクリック
        await page1.click(`.tab-menu-item:has-text("${tabs[i]}")`);
        await page1.waitForTimeout(1000);
        
        // スクリーンショット
        await page1.screenshot({ 
            path: `tab-${i+1}-${tabs[i]}.png`,
            fullPage: false,
            clip: {
                x: 0,
                y: 400,
                width: 1200,
                height: 600
            }
        });
    }
    
    // 理想のサイトも確認
    const page2 = await browser.newPage();
    await page2.goto('https://datsumo-osusume-guide.com/ranking001/?undefined=undefined', { waitUntil: 'networkidle' });
    
    await page2.waitForTimeout(2000);
    
    // 理想のサイトのタブ切り替え部分をスクリーンショット
    await page2.screenshot({ 
        path: 'ideal-layout.png',
        fullPage: false,
        clip: {
            x: 0,
            y: 300,
            width: 1200,
            height: 800
        }
    });
    
    console.log('Screenshots saved');
    
    // ブラウザを開いたままにして確認
    await page1.waitForTimeout(5000);
    
    await browser.close();
})();