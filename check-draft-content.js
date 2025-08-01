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
    
    console.log('🔍 Draftディレクトリのコンテンツ確認中...');
    
    await page.goto(`http://localhost:8090/draft/?region_id=013&t=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // セクションの存在確認
    const sections = await page.evaluate(() => {
        const results = {
            hero: !!document.querySelector('.hero-section'),
            tips: !!document.querySelector('.tips-section'),
            ranking: !!document.querySelector('.clinic-rankings'),
            comparison: !!document.querySelector('.comparison-table'),
            details: !!document.querySelector('#clinic-details-section'),
            columns: !!document.querySelector('.medical-columns'),
            footer: !!document.querySelector('footer')
        };
        
        // HTMLコンテンツのサンプルも取得
        const htmlSample = document.body.innerHTML.substring(0, 500);
        
        // エラーメッセージやコンソールエラーも確認
        const errorElements = document.querySelectorAll('.error, .not-found');
        const errors = Array.from(errorElements).map(el => el.textContent);
        
        return {
            sections: results,
            htmlSample,
            errors,
            bodyChildrenCount: document.body.children.length,
            totalElementsCount: document.querySelectorAll('*').length
        };
    });
    
    console.log('\n📊 セクション存在確認:');
    Object.entries(sections.sections).forEach(([name, exists]) => {
        console.log(`${exists ? '✅' : '❌'} ${name}`);
    });
    
    console.log('\n📈 ページ統計:');
    console.log(`- body直下の要素数: ${sections.bodyChildrenCount}`);
    console.log(`- 全要素数: ${sections.totalElementsCount}`);
    
    if (sections.errors.length > 0) {
        console.log('\n⚠️  エラー:');
        sections.errors.forEach(err => console.log(`- ${err}`));
    }
    
    console.log('\n📄 HTMLサンプル:');
    console.log(sections.htmlSample);
    
    // スクリーンショット撮影
    await page.screenshot({ 
        path: 'draft-content-check.png',
        fullPage: true
    });
    console.log('\n📷 スクリーンショット: draft-content-check.png');
    
    // コンソールエラーも確認
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Console Error:', msg.text());
        }
    });
    
    console.log('\n⏳ ブラウザを開いたままにします...');
    // ブラウザは開いたままにして手動で確認できるようにする
})();