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
    
    console.log('🔍 Draftディレクトリをローカルで確認中...');
    
    // コンソールメッセージを監視
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Console Error:', msg.text());
        }
    });
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、確認開始...');
    await page.waitForTimeout(2000);
    
    // 現在の表示状態を確認
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
        
        // ランキングセクションの詳細
        const rankingItems = document.querySelectorAll('.ranking-item');
        results.rankingItems = {
            count: rankingItems.length,
            items: Array.from(rankingItems).map((item, index) => ({
                rank: index + 1,
                clinic: item.querySelector('h3')?.textContent?.trim(),
                rating: item.querySelector('.rating-score')?.textContent?.trim()
            }))
        };
        
        return results;
    });
    
    console.log('\n📊 セクション表示状態:');
    Object.entries(pageStatus).forEach(([name, status]) => {
        if (name !== 'rankingItems') {
            console.log(`${status.exists && status.visible ? '✅' : '❌'} ${name}: ${status.height}px`);
        }
    });
    
    console.log('\n⭐ ランキング評価:');
    pageStatus.rankingItems.items.forEach(item => {
        console.log(`${item.rank}位: ${item.clinic} - ${item.rating}`);
    });
    
    // スクリーンショット
    await page.screenshot({ 
        path: 'draft-local-check.png',
        fullPage: false
    });
    console.log('\n📷 スクリーンショット: draft-local-check.png');
    
    console.log('\n🌐 ブラウザを開いたままにしています...');
    console.log('手動で確認してください。確認が終わったらCtrl+Cで終了。');
    
    // ブラウザは開いたまま
    await new Promise(() => {});
})();