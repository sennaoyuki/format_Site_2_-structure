const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 550, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('📱 550pxでテスト開始...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、3秒待機...');
    await page.waitForTimeout(3000);
    
    // 各セクションの幅情報を取得
    const widthInfo = await page.evaluate(() => {
        const sections = {
            body: document.body,
            clinicRankings: document.querySelector('.clinic-rankings'),
            rankingContainer: document.querySelector('.ranking-container'),
            comparisonTable: document.querySelector('.comparison-table'),
            clinicDetails: document.querySelector('#clinic-details-section'),
            firstRankingItem: document.querySelector('.ranking-item')
        };
        
        const results = {};
        for (const [name, element] of Object.entries(sections)) {
            if (element) {
                results[name] = {
                    offsetWidth: element.offsetWidth,
                    scrollWidth: element.scrollWidth,
                    clientWidth: element.clientWidth,
                    computedWidth: window.getComputedStyle(element).width,
                    overflow: window.getComputedStyle(element).overflowX
                };
            }
        }
        
        // ランキングアイテムの数と幅
        const rankingItems = document.querySelectorAll('.ranking-item');
        results.rankingItems = {
            count: rankingItems.length,
            widths: Array.from(rankingItems).map(item => item.offsetWidth)
        };
        
        return results;
    });
    
    console.log('\n📊 各セクションの幅情報:');
    console.log(JSON.stringify(widthInfo, null, 2));
    
    // 全体のスクリーンショット
    await page.screenshot({ 
        path: 'full-page-550px.png',
        fullPage: true 
    });
    console.log('\n📷 全体スクリーンショット: full-page-550px.png');
    
    // ランキングセクションのスクリーンショット
    const rankingSection = await page.$('.clinic-rankings');
    if (rankingSection) {
        await rankingSection.screenshot({ path: 'ranking-550px.png' });
        console.log('📷 ランキングセクション: ranking-550px.png');
    }
    
    // CASEセクションまでスクロール
    await page.evaluate(() => {
        const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
        if (caseH4) {
            caseH4.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(1000);
    
    // CASEセクションのスクリーンショット
    const caseSection = await page.evaluateHandle(() => {
        const h4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
        return h4?.closest('.clinic-points-section');
    });
    
    if (caseSection && caseSection.asElement()) {
        await caseSection.asElement().screenshot({ path: 'case-550px.png' });
        console.log('📷 CASEセクション: case-550px.png');
    }
    
    // 問題があるかチェック
    const issues = await page.evaluate(() => {
        const problems = [];
        
        // 横スクロールのチェック
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
            problems.push('ページ全体に横スクロールが発生');
        }
        
        // 各要素の幅チェック
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.offsetWidth > window.innerWidth) {
                problems.push(`要素が画面幅を超過: ${el.className || el.tagName} (${el.offsetWidth}px)`);
            }
        });
        
        return problems;
    });
    
    if (issues.length > 0) {
        console.log('\n⚠️  検出された問題:');
        issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
        console.log('\n✅ レイアウトの問題は検出されませんでした');
    }
    
    console.log('\n⏳ 10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();