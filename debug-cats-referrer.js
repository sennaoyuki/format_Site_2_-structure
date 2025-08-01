const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        // より自然なUser-Agentを設定
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // リクエストを監視
    page.on('request', request => {
        if (request.url().includes('sss.ac01.l-ad.net')) {
            console.log('\n🔗 アフィリエイトリンクへのリクエスト:');
            console.log('URL:', request.url());
            console.log('Method:', request.method());
            console.log('Headers:', request.headers());
            console.log('Referrer:', request.headers().referer || 'なし');
        }
    });
    
    console.log('🔍 CATS リファラー デバッグ開始...');
    
    // 1. メインページから開始
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード');
    
    // 2. DIOリンクをクリック
    console.log('🔗 DIOリンクをクリック...');
    
    const [redirectPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[href*="/go/dio/"]:first-of-type')
    ]);
    
    await redirectPage.waitForLoadState('networkidle');
    console.log('✅ リダイレクトページロード:', redirectPage.url());
    
    // 3. リダイレクトページの詳細情報取得
    const pageInfo = await redirectPage.evaluate(() => {
        const referrerMeta = document.querySelector('meta[name="referrer"]');
        const manualLink = document.getElementById('manualLink');
        
        return {
            title: document.title,
            referrerPolicy: referrerMeta ? referrerMeta.content : 'なし',
            currentReferrer: document.referrer,
            manualLinkHref: manualLink ? manualLink.href : 'なし',
            userAgent: navigator.userAgent,
            protocol: location.protocol,
            countdown: document.getElementById('countdown')?.textContent
        };
    });
    
    console.log('\n📄 リダイレクトページ詳細:');
    console.log('- タイトル:', pageInfo.title);
    console.log('- リファラーポリシー:', pageInfo.referrerPolicy);
    console.log('- 現在のリファラー:', pageInfo.currentReferrer);
    console.log('- 最終リンクURL:', pageInfo.manualLinkHref);
    console.log('- プロトコル:', pageInfo.protocol);
    console.log('- User-Agent:', pageInfo.userAgent.substring(0, 100) + '...');
    
    // 4. 自動リダイレクトを待機
    console.log('\n⏳ 自動リダイレクト待機...');
    
    try {
        // リダイレクトを5秒間監視
        await redirectPage.waitForEvent('framenavigated', { timeout: 8000 });
        console.log('✅ 自動リダイレクト実行');
        console.log('最終URL:', redirectPage.url());
        
        // 最終ページのリファラー確認
        const finalReferrer = await redirectPage.evaluate(() => {
            return {
                referrer: document.referrer,
                url: location.href,
                host: location.host
            };
        });
        
        console.log('\n📊 最終ページ情報:');
        console.log('- URL:', finalReferrer.url);
        console.log('- Host:', finalReferrer.host);
        console.log('- Referrer:', finalReferrer.referrer);
        
    } catch (error) {
        console.log('❌ 自動リダイレクトタイムアウト');
        
        // 手動でテスト
        console.log('🔗 手動リンククリックをテスト...');
        await redirectPage.click('#manualLink');
        await redirectPage.waitForTimeout(3000);
        
        const manualResult = await redirectPage.evaluate(() => ({
            url: location.href,
            referrer: document.referrer
        }));
        
        console.log('手動クリック結果:');
        console.log('- URL:', manualResult.url);
        console.log('- Referrer:', manualResult.referrer);
    }
    
    console.log('\n✅ デバッグ完了');
    console.log('📋 Network タブでリクエストヘッダーを確認してください');
    
    // ブラウザを開いたまま
    await new Promise(() => {});
})();