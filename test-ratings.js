const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 900 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 星評価の変更を確認中...');
    
    await page.goto(`http://localhost:8090/draft/?region_id=013&t=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // ランキングセクションまでスクロール
    await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        if (rankingSection) {
            rankingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(1500);
    
    // 評価値を取得
    const ratings = await page.evaluate(() => {
        const rankingItems = document.querySelectorAll('.ranking-item');
        const results = [];
        
        rankingItems.forEach((item, index) => {
            const scoreElement = item.querySelector('.rating-score');
            const starsElement = item.querySelector('.stars');
            const clinicName = item.querySelector('h3')?.textContent?.trim();
            
            results.push({
                rank: index + 1,
                clinic: clinicName,
                score: scoreElement?.textContent?.trim(),
                starsCount: starsElement?.querySelectorAll('.fas.fa-star').length,
                halfStar: starsElement?.querySelector('.fas.fa-star-half-alt') ? true : false
            });
        });
        
        return results;
    });
    
    console.log('\n📊 更新された評価値:');
    ratings.forEach(rating => {
        console.log(`${rating.rank}位 ${rating.clinic}: ${rating.score} (★${rating.starsCount}${rating.halfStar ? '.5' : ''})`);
    });
    
    // 比較表の評価も確認
    const comparisonRatings = await page.evaluate(() => {
        const evaluationElements = document.querySelectorAll('.ranking_evaluation');
        const results = [];
        
        evaluationElements.forEach((element, index) => {
            results.push({
                position: index + 1,
                rating: element.textContent?.trim()
            });
        });
        
        return results;
    });
    
    console.log('\n📋 比較表の評価値:');
    comparisonRatings.forEach(rating => {
        console.log(`${rating.position}位: ${rating.rating}`);
    });
    
    // スクリーンショット撮影
    await page.screenshot({ 
        path: 'updated-ratings.png',
        fullPage: false
    });
    console.log('\n📷 スクリーンショット: updated-ratings.png');
    
    console.log('\n⏳ 3秒後にブラウザを閉じます...');
    await page.waitForTimeout(3000);
    
    await browser.close();
    console.log('✅ 評価確認完了');
})();