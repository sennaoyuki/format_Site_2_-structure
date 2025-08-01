const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 最終確認: Draftディレクトリ...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // 全体の状態を確認
    const pageStatus = await page.evaluate(() => {
        const sections = {
            hero: document.querySelector('.hero-section'),
            tips: document.querySelector('.tips-section'),
            ranking: document.querySelector('.clinic-rankings'),
            comparison: document.querySelector('.comparison-table'),
            details: document.querySelector('#clinic-details-section'),
            columns: document.querySelector('.medical-columns-section'),
            footer: document.querySelector('#footer')
        };
        
        const results = {};
        for (const [name, element] of Object.entries(sections)) {
            results[name] = {
                exists: !!element,
                visible: element ? window.getComputedStyle(element).display !== 'none' : false,
                height: element ? element.offsetHeight : 0
            };
        }
        
        // ランキングの詳細確認
        const rankingItems = document.querySelectorAll('.ranking-item');
        results.ranking = {
            ...results.ranking,
            items: Array.from(rankingItems).map((item, index) => ({
                rank: index + 1,
                clinicName: item.querySelector('h3')?.textContent?.trim(),
                rating: item.querySelector('.rating-score')?.textContent?.trim()
            }))
        };
        
        return results;
    });
    
    console.log('\n✅ セクション表示状態:');
    Object.entries(pageStatus).forEach(([name, status]) => {
        if (name !== 'ranking') {
            console.log(`${status.exists && status.visible ? '✅' : '❌'} ${name}: ${status.height}px`);
        }
    });
    
    console.log('\n⭐ ランキング詳細:');
    if (pageStatus.ranking && pageStatus.ranking.items) {
        pageStatus.ranking.items.forEach(item => {
            console.log(`${item.rank}位: ${item.clinicName} - ${item.rating}`);
        });
    }
    
    // スクリーンショット
    await page.screenshot({ 
        path: 'draft-final-check.png',
        fullPage: false
    });
    console.log('\n📷 スクリーンショット: draft-final-check.png');
    
    // 公式サイトボタンのリンクを確認
    const buttonLinks = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.ranking-item a[target="_blank"]');
        return Array.from(buttons).slice(0, 2).map((btn, index) => ({
            rank: index + 1,
            href: btn.href
        }));
    });
    
    console.log('\n🔗 公式サイトボタンのリンク:');
    buttonLinks.forEach(link => {
        console.log(`${link.rank}位: ${link.href}`);
    });
    
    console.log('\n✅ 確認完了。ブラウザは開いたままです。');
    await new Promise(() => {});
})();