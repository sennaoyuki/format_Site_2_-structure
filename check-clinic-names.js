const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 クリニック名の問題を調査中...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // データの状態を確認
    const dataInfo = await page.evaluate(() => {
        const result = {
            dataManager: {
                exists: typeof window.dataManager !== 'undefined',
                clinicsCount: window.dataManager ? window.dataManager.clinics.length : 0,
                clinics: window.dataManager ? window.dataManager.clinics.slice(0, 5).map(c => ({
                    id: c.id,
                    name: c.name,
                    rank: c.rank
                })) : []
            },
            rankingItems: []
        };
        
        // ランキングアイテムの状態を確認
        const rankingItems = document.querySelectorAll('.ranking-item');
        rankingItems.forEach((item, index) => {
            const h3 = item.querySelector('h3');
            const nameSpan = item.querySelector('.clinic-name');
            const bannerAlt = item.querySelector('.detail-banner img')?.alt;
            
            result.rankingItems.push({
                index: index + 1,
                h3Text: h3?.textContent?.trim(),
                h3InnerHTML: h3?.innerHTML?.substring(0, 100),
                nameSpan: nameSpan?.textContent?.trim(),
                bannerAlt: bannerAlt,
                hasH3: !!h3,
                h3Children: h3 ? h3.children.length : 0
            });
        });
        
        return result;
    });
    
    console.log('\n📊 データ分析:');
    console.log(JSON.stringify(dataInfo, null, 2));
    
    // app.jsのgetClinicDisplayName関数を確認
    const displayNameFunction = await page.evaluate(() => {
        if (window.app && window.app.displayManager && window.app.displayManager.getClinicDisplayName) {
            // 関数が存在する場合、テスト実行
            const testClinic = { id: '1', name: 'ディオクリニック' };
            return {
                functionExists: true,
                testResult: window.app.displayManager.getClinicDisplayName(testClinic)
            };
        }
        return { functionExists: false };
    });
    
    console.log('\n🔧 getClinicDisplayName関数:', displayNameFunction);
    
    // HTMLの生成方法を確認
    const generationCode = await page.evaluate(() => {
        // generateRankingCard関数の一部を取得
        if (window.app && window.app.displayManager && window.app.displayManager.generateRankingCard) {
            return {
                hasFunction: true,
                functionString: window.app.displayManager.generateRankingCard.toString().substring(0, 500)
            };
        }
        return { hasFunction: false };
    });
    
    console.log('\n📝 generateRankingCard関数:', generationCode);
    
    console.log('\n🌐 ブラウザを開いたままにしています...');
    await new Promise(() => {});
})();