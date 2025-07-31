const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 550, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('📱 550px ランキングセクションキャプチャ開始...');
    
    await page.goto(`http://localhost:8090/draft/?region_id=013&t=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、3秒待機...');
    await page.waitForTimeout(3000);
    
    // ランキングセクションまでスクロール
    await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        if (rankingSection) {
            rankingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(1500);
    
    // ランキングセクションのスクリーンショット
    const rankingSection = await page.$('.clinic-rankings');
    if (rankingSection) {
        await rankingSection.screenshot({ 
            path: 'ranking-section-550px.png',
            type: 'png'
        });
        console.log('📷 ランキングセクション: ranking-section-550px.png');
        
        // 幅情報も確認
        const sectionInfo = await page.evaluate(() => {
            const section = document.querySelector('.clinic-rankings');
            const container = document.querySelector('.ranking-container');
            const items = document.querySelectorAll('.ranking-item');
            
            return {
                viewport: window.innerWidth,
                section: {
                    offsetWidth: section?.offsetWidth,
                    computedWidth: section ? window.getComputedStyle(section).width : null
                },
                container: {
                    offsetWidth: container?.offsetWidth,
                    computedWidth: container ? window.getComputedStyle(container).width : null
                },
                itemCount: items.length,
                firstItemWidth: items[0]?.offsetWidth
            };
        });
        
        console.log('\n📊 ランキングセクション情報:');
        console.log(`- ビューポート幅: ${sectionInfo.viewport}px`);
        console.log(`- セクション幅: ${sectionInfo.section.offsetWidth}px (${sectionInfo.section.computedWidth})`);
        console.log(`- コンテナ幅: ${sectionInfo.container.offsetWidth}px (${sectionInfo.container.computedWidth})`);
        console.log(`- ランキングアイテム数: ${sectionInfo.itemCount}個`);
        console.log(`- 最初のアイテム幅: ${sectionInfo.firstItemWidth}px`);
    } else {
        console.log('❌ ランキングセクションが見つかりません');
    }
    
    console.log('\n⏳ 3秒後にブラウザを閉じます...');
    await page.waitForTimeout(3000);
    
    await browser.close();
    console.log('✅ キャプチャ完了');
})();