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
    
    console.log('🔍 URLパラメータの分析...');
    
    // メインページをロード
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード完了');
    await page.waitForTimeout(2000);
    
    // 各セクションのリンクを確認
    const linkInfo = await page.evaluate(() => {
        const links = [];
        
        // DIOのリンクを全て取得
        document.querySelectorAll('a[href*="/draft/go/dio/"]').forEach((link, index) => {
            const url = new URL(link.href);
            const params = Object.fromEntries(url.searchParams.entries());
            
            // リンクの場所を特定
            let location = 'unknown';
            if (link.closest('.ranking-item')) {
                location = 'ranking';
            } else if (link.closest('.comparison-table')) {
                location = 'comparison';
            } else if (link.closest('.first-choice-recommendation')) {
                location = 'recommendation';
            } else if (link.closest('#first-choice-points')) {
                location = 'points';
            }
            
            links.push({
                index: index + 1,
                location,
                text: link.textContent.trim().substring(0, 30),
                href: link.href,
                params
            });
        });
        
        return links;
    });
    
    console.log('\n📋 DIOへのリンク分析:');
    linkInfo.forEach(link => {
        console.log(`\n${link.index}. 場所: ${link.location}`);
        console.log(`   テキスト: ${link.text}`);
        console.log(`   URL: ${link.href}`);
        console.log(`   パラメータ:`, link.params);
        
        // detail_click と click_clinic の重複チェック
        if (link.params.detail_click && link.params.click_clinic) {
            console.log(`   ⚠️  重複パラメータ発見: detail_click="${link.params.detail_click}" と click_clinic="${link.params.click_clinic}"`);
        }
    });
    
    // 現在のページのパラメータも確認
    const currentParams = await page.evaluate(() => {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    });
    
    console.log('\n🌐 現在のページパラメータ:', currentParams);
    
    console.log('\n✅ 分析完了');
    await browser.close();
})();