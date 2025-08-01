const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 region_id=001でのリファラー送信テスト開始...');
    
    // region_id=001でアクセス
    await page.goto('http://localhost:8090/draft/?region_id=001', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // ディオクリニックのリンクを探してクリック
    console.log('ディオクリニックのリンクを探しています...');
    
    const dioLinkSelector = 'a[href*="/draft/go/dio/"]';
    const dioLink = await page.$(dioLinkSelector);
    
    if (dioLink) {
        const href = await dioLink.getAttribute('href');
        console.log('✅ ディオクリニックのリンク発見:', href);
        
        // リダイレクトページへの遷移を監視
        const [redirectResponse] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            dioLink.click()
        ]);
        
        console.log('📍 リダイレクトページURL:', page.url());
        
        // リダイレクトページのconsole.logを監視
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('リファラー') || text.includes('遷移先')) {
                console.log('🖥️ ページ内ログ:', text);
            }
        });
        
        // 最終的なリダイレクト先への遷移を待つ
        await page.waitForTimeout(5000);
        
        console.log('📊 最終結果:');
        console.log('  - 最終URL:', page.url());
        console.log('  - URLパラメータ:', new URL(page.url()).searchParams.toString());
        
        // region_id=001が含まれているか確認
        const finalUrl = new URL(page.url());
        const hasRegionId001 = finalUrl.searchParams.get('region_id') === '001';
        console.log(`  - region_id=001が含まれている: ${hasRegionId001 ? '✅' : '❌'}`);
        
    } else {
        console.error('❌ ディオクリニックのリンクが見つかりません');
    }
    
    console.log('\n🌐 ブラウザを開いたままにしています...');
    await new Promise(() => {});
})();