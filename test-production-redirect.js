const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 本番環境のリダイレクトページを直接テスト\n');
    
    // 本番環境のURL（HTTPSを使用）
    const productionDomain = 'https://www.xn--ecki4eoz3204ct89aepry34c.com'; // 医療ダイエット比較ランキング.com
    
    // ネットワークリクエストを監視
    const requests = [];
    page.on('request', request => {
        const url = request.url();
        if (url.includes('sss.ac01.l-ad.net') || url.includes('dioclinic')) {
            requests.push({
                url: url,
                headers: request.headers(),
                method: request.method()
            });
            console.log(`📡 リクエスト: ${request.method()} ${url}`);
            console.log(`   Referer: ${request.headers()['referer'] || 'なし'}\n`);
        }
    });
    
    // テストケース
    const testCases = [
        { regionId: '001', name: '北海道' },
        { regionId: '013', name: '東京' },
        { regionId: '026', name: '京都' }
    ];
    
    for (const test of testCases) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📍 region_id=${test.regionId} (${test.name}) のテスト`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // 本番環境のリダイレクトページに直接アクセス
        const redirectUrl = `${productionDomain}/draft/go/dio/?region_id=${test.regionId}`;
        console.log(`アクセスURL: ${redirectUrl}\n`);
        
        try {
            await page.goto(redirectUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
            
            // リダイレクトページの情報を取得
            const pageInfo = await page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    referrerPolicy: document.querySelector('meta[name="referrer"]')?.content,
                    hasRedirectScript: !!document.querySelector('script')?.textContent?.includes('redirectUrl')
                };
            });
            
            console.log('📄 ページ情報:');
            console.log(`   タイトル: ${pageInfo.title}`);
            console.log(`   現在のURL: ${pageInfo.url}`);
            console.log(`   リファラーポリシー: ${pageInfo.referrerPolicy || 'なし'}`);
            console.log(`   リダイレクトスクリプト: ${pageInfo.hasRedirectScript ? '有り' : '無し'}`);
            
            // リダイレクトを待つ
            console.log('\n⏳ リダイレクトを待機中...');
            await page.waitForTimeout(6000);
            
            console.log(`\n📊 最終URL: ${page.url()}`);
            
            // region_idが引き継がれているか確認
            const finalUrl = new URL(page.url());
            const hasRegionId = finalUrl.searchParams.has('region_id');
            const regionIdValue = finalUrl.searchParams.get('region_id');
            
            console.log(`   region_idパラメータ: ${hasRegionId ? `有り (${regionIdValue})` : '無し'}`);
            
        } catch (error) {
            console.error(`❌ エラー: ${error.message}`);
            
            // 404エラーの場合の代替URL
            if (error.message.includes('404')) {
                console.log('\n💡 404エラー。代替URLを試します...');
                const altUrls = [
                    `${productionDomain}/go/dio/?region_id=${test.regionId}`,
                    `https://医療ダイエット比較ランキング.com/draft/go/dio/?region_id=${test.regionId}`,
                    `https://医療ダイエット比較ランキング.com/go/dio/?region_id=${test.regionId}`
                ];
                
                console.log('試すURL:');
                altUrls.forEach(url => console.log(`  - ${url}`));
            }
        }
        
        await page.waitForTimeout(2000);
    }
    
    console.log('\n\n💡 まとめ:');
    console.log('1. 本番環境のリダイレクトページURLを確認');
    console.log('2. HTTPSでアクセスすることで、より正確なリファラー送信を確認');
    console.log('3. すべてのregion_idで同じ挙動になるはず');
    
    await browser.close();
})();