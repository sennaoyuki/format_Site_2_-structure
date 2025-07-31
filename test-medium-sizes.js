const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    // 480〜768pxの範囲でテスト
    const testSizes = [
        { name: '480px', width: 480, height: 800 },
        { name: '600px', width: 600, height: 800 },
        { name: '768px', width: 768, height: 1024 }
    ];
    
    for (const size of testSizes) {
        console.log(`\n========== ${size.name} テスト ==========`);
        
        const context = await browser.newContext({
            viewport: { width: size.width, height: size.height }
        });
        
        const page = await context.newPage();
        
        await page.goto('http://localhost:8090/draft/?region_id=013', {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(2000);
        
        // ランキングセクションの情報を取得
        const rankingInfo = await page.evaluate(() => {
            const rankingSection = document.querySelector('.clinic-rankings');
            const rankingContainer = document.querySelector('.ranking-container');
            const rankingItems = document.querySelectorAll('.ranking-item');
            
            return {
                sectionWidth: rankingSection?.offsetWidth,
                containerWidth: rankingContainer?.offsetWidth,
                containerScrollWidth: rankingContainer?.scrollWidth,
                itemCount: rankingItems.length,
                firstItemWidth: rankingItems[0]?.offsetWidth,
                containerStyles: rankingContainer ? {
                    overflow: window.getComputedStyle(rankingContainer).overflowX,
                    display: window.getComputedStyle(rankingContainer).display,
                    flexWrap: window.getComputedStyle(rankingContainer).flexWrap
                } : null
            };
        });
        
        console.log('📊 ランキングセクション情報:', rankingInfo);
        
        // スクリーンショット撮影
        const rankingSection = await page.$('.clinic-rankings');
        if (rankingSection) {
            const filename = `ranking-${size.width}px.png`;
            await rankingSection.screenshot({ path: filename });
            console.log(`📷 スクリーンショット: ${filename}`);
        }
        
        await context.close();
    }
    
    console.log('\n✅ すべてのテスト完了');
    await browser.close();
})();