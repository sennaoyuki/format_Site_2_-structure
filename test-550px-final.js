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
    
    console.log('📱 Final 550px test...');
    
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
    
    await page.waitForTimeout(1000);
    
    // ランキングセクションのスクリーンショット
    const rankingSection = await page.$('.clinic-rankings');
    if (rankingSection) {
        await rankingSection.screenshot({ path: 'ranking-550px-fixed.png' });
        console.log('📷 ランキングセクション(修正版): ranking-550px-fixed.png');
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
        await caseSection.asElement().screenshot({ path: 'case-550px-fixed.png' });
        console.log('📷 CASEセクション(修正版): case-550px-fixed.png');
    }
    
    // 幅の最終確認
    const finalCheck = await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        const rankingContainer = document.querySelector('.ranking-container');
        
        return {
            viewport: { width: window.innerWidth },
            rankingSection: rankingSection ? {
                offsetWidth: rankingSection.offsetWidth,
                computedWidth: window.getComputedStyle(rankingSection).width,
                maxWidth: window.getComputedStyle(rankingSection).maxWidth
            } : null,
            rankingContainer: rankingContainer ? {
                offsetWidth: rankingContainer.offsetWidth,
                computedWidth: window.getComputedStyle(rankingContainer).width
            } : null
        };
    });
    
    console.log('\n✅ 修正後の幅情報:');
    console.log(JSON.stringify(finalCheck, null, 2));
    
    console.log('\n⏳ 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();