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
    
    console.log('🔍 リファラー送信テスト...');
    
    // 1. メインページから開始
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード完了');
    
    // 2. DIOクリニックのリンクをクリック
    console.log('🔗 DIOクリニックのリンクをクリック...');
    
    // Promise for new page
    const newPagePromise = context.waitForEvent('page');
    
    // 最初のDIOリンクをクリック
    await page.click('a[href*="/go/dio/"]:first-of-type');
    
    const redirectPage = await newPagePromise;
    await redirectPage.waitForLoadState('networkidle');
    
    console.log('✅ リダイレクトページロード完了');
    console.log('URL:', redirectPage.url());
    
    // 3. リダイレクトページの内容確認
    const pageInfo = await redirectPage.evaluate(() => {
        return {
            title: document.title,
            referrerPolicy: document.querySelector('meta[name="referrer"]')?.content,
            manualLinkExists: !!document.getElementById('manualLink'),
            countdown: document.getElementById('countdown')?.textContent
        };
    });
    
    console.log('\n📄 リダイレクトページ情報:');
    console.log('- タイトル:', pageInfo.title);
    console.log('- リファラーポリシー:', pageInfo.referrerPolicy);
    console.log('- 手動リンク存在:', pageInfo.manualLinkExists ? '✅' : '❌');
    console.log('- カウントダウン:', pageInfo.countdown);
    
    // 4. 3秒間待機してリダイレクトを観察
    console.log('\n⏳ 自動リダイレクトを待機中...');
    
    // リダイレクトを監視
    const redirectPromise = redirectPage.waitForEvent('framenavigated', { timeout: 10000 });
    
    try {
        await redirectPromise;
        console.log('✅ 自動リダイレクト実行');
        console.log('最終URL:', redirectPage.url());
        
        // リファラーをチェック（可能であれば）
        const finalReferrer = await redirectPage.evaluate(() => {
            return document.referrer;
        });
        console.log('送信されたリファラー:', finalReferrer);
        
    } catch (error) {
        console.log('❌ 自動リダイレクトがタイムアウトしました');
        
        // 手動でリンクをテスト
        console.log('🔗 手動リンクをテスト...');
        await redirectPage.click('#manualLink');
        await redirectPage.waitForTimeout(2000);
        console.log('手動リンク後URL:', redirectPage.url());
    }
    
    console.log('\n✅ テスト完了');
    
    // ブラウザを開いたままにする
    console.log('ブラウザは開いたままです。DevToolsのNetworkタブでリファラーを確認してください。');
    await new Promise(() => {}); // Keep browser open
})();