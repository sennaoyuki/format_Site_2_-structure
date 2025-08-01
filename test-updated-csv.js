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
    
    console.log('🔍 更新されたCSVデータのテスト...');
    
    // コンソールログを監視
    page.on('console', msg => {
        if (msg.type() === 'log' && (msg.text().includes('CSV') || msg.text().includes('data') || msg.text().includes('ranking'))) {
            console.log('📝 データ関連ログ:', msg.text());
        }
    });
    
    // 013 (東京) でテスト
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード完了 (region_id=013)');
    await page.waitForTimeout(3000);
    
    // 現在のランキング順序を確認
    const rankingOrder = await page.evaluate(() => {
        const rankings = [];
        document.querySelectorAll('.ranking-item').forEach((item, index) => {
            const clinicName = item.querySelector('h3')?.textContent?.trim();
            const rank = index + 1;
            rankings.push({ rank, clinicName });
        });
        return rankings;
    });
    
    console.log('\n🏆 現在のランキング順序 (region_id=013):');
    rankingOrder.forEach(item => {
        console.log(`${item.rank}位: ${item.clinicName}`);
    });
    
    // CSVデータと照合
    console.log('\n📊 期待値 (CSVデータより):');
    console.log('013行目: 1,3,4,2,5');
    console.log('期待順序: 1位=ディオ, 2位=リエート, 3位=エミナル, 4位=ウララ, 5位=湘南美容');
    
    // 異なる地域でもテスト
    await page.goto('http://localhost:8090/draft/?region_id=001', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    const ranking001 = await page.evaluate(() => {
        const rankings = [];
        document.querySelectorAll('.ranking-item').forEach((item, index) => {
            const clinicName = item.querySelector('h3')?.textContent?.trim();
            const rank = index + 1;
            rankings.push({ rank, clinicName });
        });
        return rankings;
    });
    
    console.log('\n🏆 ランキング順序 (region_id=001):');
    ranking001.forEach(item => {
        console.log(`${item.rank}位: ${item.clinicName}`);
    });
    
    console.log('\n📊 期待値 (CSVデータより):');
    console.log('001行目: 1,2,5,-,-');
    console.log('期待順序: 1位=ディオ, 2位=ウララ, 3位=湘南美容のみ');
    
    // 店舗データも確認
    const storeInfo = await page.evaluate(() => {
        const stores = [];
        document.querySelectorAll('.clinic-rankings .shop-item, .store-item').forEach(store => {
            const storeName = store.querySelector('.store-name, .shop-name')?.textContent?.trim();
            if (storeName) {
                stores.push(storeName);
            }
        });
        return stores;
    });
    
    console.log('\n🏪 表示中の店舗:');
    storeInfo.forEach(store => console.log(`- ${store}`));
    
    console.log('\n✅ テスト完了');
    await browser.close();
})();