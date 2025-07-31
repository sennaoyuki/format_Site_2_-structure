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
    
    console.log('🔍 完全パラメータ付きリファラーテスト開始...');
    
    // ネットワーク監視
    page.on('request', request => {
        if (request.url().includes('sss.ac01.l-ad.net')) {
            console.log('\n🌐 アフィリエイトサイトへのリクエスト:');
            console.log('URL:', request.url());
            console.log('Referrer:', request.headers().referer || '❌ リファラーなし');
            console.log('User-Agent:', request.headers()['user-agent']?.substring(0, 50) + '...');
        }
    });
    
    // コンソールログを監視
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('📝 ブラウザログ:', msg.text());
        }
    });
    
    // 1. メインページから開始
    await page.goto('http://localhost:8090/draft/?region_id=013&utm_source=test&utm_campaign=referrer_test', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード（パラメータ付き）');
    
    // 2. DIOリンクをクリック
    console.log('🔗 DIOリンクをクリック...');
    
    const [redirectPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[href*="/draft/go/dio/"]:first-of-type')
    ]);
    
    await redirectPage.waitForLoadState('networkidle');
    
    // 3. リダイレクトページの詳細情報
    const redirectInfo = await redirectPage.evaluate(() => {
        return {
            currentUrl: window.location.href,
            referrer: document.referrer,
            referrerPolicy: document.querySelector('meta[name="referrer"]')?.content,
            cspReferrer: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content
        };
    });
    
    console.log('\n📄 リダイレクトページ情報:');
    console.log('- 現在URL:', redirectInfo.currentUrl);
    console.log('- リファラー:', redirectInfo.referrer);
    console.log('- リファラーポリシー:', redirectInfo.referrerPolicy);
    console.log('- CSPポリシー:', redirectInfo.cspReferrer);
    
    // URLからパラメータを抽出
    const urlParams = new URL(redirectInfo.currentUrl).searchParams;
    const params = Object.fromEntries(urlParams.entries());
    console.log('- URLパラメータ:', params);
    
    // 4. 自動リダイレクトを待機
    console.log('\n⏳ 自動リダイレクト待機（ログ確認）...');
    
    try {
        // 最大8秒待機
        await redirectPage.waitForEvent('framenavigated', { timeout: 8000 });
        
        const finalUrl = redirectPage.url();
        console.log('\n✅ 最終遷移完了');
        console.log('最終URL:', finalUrl);
        
        // 最終ページでのリファラー確認
        if (finalUrl.includes('sss.ac01.l-ad.net')) {
            console.log('🎯 アフィリエイトサイトに到達');
            
            // ページが完全に読み込まれるまで待機
            await redirectPage.waitForTimeout(2000);
            
            const finalReferrer = await redirectPage.evaluate(() => {
                return document.referrer;
            });
            
            console.log('📋 最終的に受け取られたリファラー:', finalReferrer);
            
            // パラメータが含まれているかチェック
            if (finalReferrer.includes('region_id=') || finalReferrer.includes('click_section=')) {
                console.log('✅ パラメータ付きリファラー送信成功！');
            } else {
                console.log('❌ パラメータがリファラーに含まれていません');
            }
        }
        
    } catch (error) {
        console.log('❌ リダイレクトタイムアウト:', error.message);
    }
    
    console.log('\n📊 テスト完了');
    console.log('DevToolsのNetworkタブでリクエストヘッダーを確認してください');
    
    // ブラウザを開いたまま
    await new Promise(() => {});
})();