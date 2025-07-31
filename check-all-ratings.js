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
    
    console.log('🔍 すべての評価表示箇所を確認中...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // すべての評価表示要素を検索
    const allRatings = await page.evaluate(() => {
        const results = [];
        
        // 1. ランキングセクション内の評価
        const rankingScores = document.querySelectorAll('.ranking-item .rating-score');
        rankingScores.forEach((el, index) => {
            results.push({
                section: 'ランキングセクション',
                position: index + 1,
                text: el.textContent?.trim(),
                element: el.className
            });
        });
        
        // 2. 比較表内の評価
        const comparisonRatings = document.querySelectorAll('.ranking_evaluation');
        comparisonRatings.forEach((el, index) => {
            results.push({
                section: '比較表',
                position: index + 1,
                text: el.textContent?.trim(),
                element: el.className,
                parent: el.parentElement?.parentElement?.querySelector('.ranking-table_td1 a')?.textContent?.trim()
            });
        });
        
        // 3. 詳細セクション内の評価
        const detailRatings = document.querySelectorAll('.detail-item .rating-score, .clinic-detail-wrapper .rating-score');
        detailRatings.forEach((el, index) => {
            results.push({
                section: '詳細セクション',
                position: index + 1,
                text: el.textContent?.trim(),
                element: el.className
            });
        });
        
        // 4. その他の場所で評価が表示されている箇所
        const otherRatings = document.querySelectorAll('[class*="rating"]:not(.ranking_evaluation):not(.rating-score)');
        otherRatings.forEach((el, index) => {
            if (el.textContent && /\d\.\d/.test(el.textContent)) {
                results.push({
                    section: 'その他',
                    position: index + 1,
                    text: el.textContent?.trim(),
                    element: el.className,
                    html: el.outerHTML.substring(0, 100)
                });
            }
        });
        
        return results;
    });
    
    console.log('\n📊 見つかった評価表示:');
    allRatings.forEach(rating => {
        console.log(`${rating.section} - 位置${rating.position}: ${rating.text}`);
        if (rating.parent) console.log(`  (クリニック: ${rating.parent})`);
    });
    
    // 画像のような4つのカード表示を探す
    const cardSections = await page.evaluate(() => {
        const possibleSections = [];
        
        // カード形式の表示を探す
        const cardContainers = document.querySelectorAll('[class*="card"], [class*="pick"], [class*="recommend"], [class*="top"]');
        cardContainers.forEach(container => {
            const cards = container.querySelectorAll('[class*="item"], [class*="card"]');
            if (cards.length >= 4) {
                const ratings = [];
                cards.forEach(card => {
                    const ratingText = card.textContent?.match(/\d\.\d/);
                    if (ratingText) {
                        ratings.push(ratingText[0]);
                    }
                });
                
                if (ratings.length > 0) {
                    possibleSections.push({
                        containerClass: container.className,
                        cardCount: cards.length,
                        ratings: ratings,
                        html: container.outerHTML.substring(0, 200)
                    });
                }
            }
        });
        
        return possibleSections;
    });
    
    console.log('\n🎯 カード形式のセクション:');
    cardSections.forEach(section => {
        console.log(`コンテナ: ${section.containerClass}`);
        console.log(`カード数: ${section.cardCount}`);
        console.log(`評価値: ${section.ratings.join(', ')}`);
    });
    
    console.log('\n🌐 ブラウザを開いたままにしています...');
    await new Promise(() => {});
})();