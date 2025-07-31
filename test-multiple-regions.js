const { chromium } = require('playwright');

async function testRegion(page, regionId) {
    console.log(`\n🔍 Testing region_id=${regionId}...`);
    
    // リダイレクトページに直接アクセス
    await page.goto(`http://localhost:8090/draft/go/dio/?region_id=${regionId}`);
    
    // リダイレクト先URLを取得
    const redirectInfo = await page.evaluate(() => {
        const manualLink = document.getElementById('manualLink');
        return {
            currentUrl: window.location.href,
            redirectUrl: manualLink ? manualLink.href : null,
            referrerPolicy: document.querySelector('meta[name="referrer"]')?.content
        };
    });
    
    console.log(`   現在のURL: ${redirectInfo.currentUrl}`);
    console.log(`   リダイレクト先: ${redirectInfo.redirectUrl}`);
    console.log(`   リファラーポリシー: ${redirectInfo.referrerPolicy}`);
    
    return redirectInfo;
}

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('📊 複数のregion_idでリファラー送信をテスト');
    console.log('すべて同じリファラーポリシー（unsafe-url）が設定されているか確認\n');
    
    // テストする地域
    const regions = [
        '001', // 北海道
        '013', // 東京
        '026', // 京都
        '027', // 大阪
        '040'  // 福岡
    ];
    
    const results = [];
    
    for (const regionId of regions) {
        const result = await testRegion(page, regionId);
        results.push({
            regionId,
            ...result
        });
        await page.waitForTimeout(1000);
    }
    
    // 結果の比較
    console.log('\n📋 結果の比較:');
    console.log('すべてのregion_idで同じリファラーポリシーか？');
    
    const policies = results.map(r => r.referrerPolicy);
    const allSame = policies.every(p => p === policies[0]);
    
    if (allSame) {
        console.log('✅ すべて同じリファラーポリシー:', policies[0]);
    } else {
        console.log('❌ 異なるリファラーポリシーが存在:');
        results.forEach(r => {
            console.log(`   region_id=${r.regionId}: ${r.referrerPolicy}`);
        });
    }
    
    console.log('\n💡 推奨事項:');
    console.log('1. 本番環境（HTTPS）でのテストも実施');
    console.log('2. CATSのサポートに問い合わせて仕様を確認');
    console.log('3. region_id=001以外の地域でも同じ問題が発生するか確認');
    
    await browser.close();
})();