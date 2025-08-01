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
    
    console.log('🔍 ハードリロードでCSVデータ確認...');
    
    // コンソールログを監視
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('📝 ブラウザログ:', msg.text());
        }
    });
    
    // キャッシュを無効化してロード
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    // ハードリロード実行
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 現在のランキングデータを詳細に取得
    const debugInfo = await page.evaluate(() => {
        // データマネージャーの状態を確認
        const rankings = window.app?.dataManager?.rankings;
        const region013 = rankings?.find(r => r.regionId === '013');
        
        return {
            rankingsExists: !!rankings,
            rankingsCount: rankings?.length,
            region013: region013,
            allRegions: rankings?.map(r => r.regionId).slice(0, 10)
        };
    });
    
    console.log('\n🔍 データマネージャーの状態:');
    console.log('- rankings存在:', debugInfo.rankingsExists);
    console.log('- rankings数:', debugInfo.rankingsCount);
    console.log('- region013データ:', debugInfo.region013);
    console.log('- 利用可能地域(最初10件):', debugInfo.allRegions);
    
    // 013のCSV行データと比較
    if (debugInfo.region013) {
        console.log('\n📊 region 013の詳細:');
        console.log('- regionId:', debugInfo.region013.regionId);
        console.log('- ranks:', debugInfo.region013.ranks);
        
        // CSVの期待値と比較
        console.log('\n期待値 (CSV 013行目): 1,3,4,2,5');
        console.log('実際の値:', debugInfo.region013.ranks);
    }
    
    console.log('\n✅ デバッグ完了');
    await browser.close();
})();