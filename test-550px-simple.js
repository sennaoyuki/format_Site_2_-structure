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
    
    console.log('📱 550pxでテスト開始...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
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
    
    await page.waitForTimeout(1000);
    
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
    
    // 幅の情報を取得
    const widthInfo = await page.evaluate(() => {
        const elements = {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            body: document.body.offsetWidth,
            rankingSection: document.querySelector('.clinic-rankings')?.offsetWidth,
            rankingContainer: document.querySelector('.ranking-container')?.offsetWidth
        };
        return elements;
    });
    
    console.log('\n📊 幅情報:', widthInfo);
    
    console.log('\n⏳ 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();