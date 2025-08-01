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
    
    console.log('🔍 比較表更新のデバッグテスト...');
    
    // コンソールログを監視（比較表関連）
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('比較表') || text.includes('ランキング') || text.includes('updateComparisonTable') || text.includes('🔄') || text.includes('🏆')) {
            console.log('📝 比較表ログ:', text);
        }
    });
    
    // 013 (東京) でテスト
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード完了 (region_id=013)');
    await page.waitForTimeout(3000);
    
    // 比較表の実際の内容を確認
    const comparisonTableOrder = await page.evaluate(() => {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return 'comparison-tbody not found';
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        return rows.map((row, index) => {
            const clinicLink = row.querySelector('.clinic-link');
            const clinicName = clinicLink ? clinicLink.textContent.trim() : 'Unknown';
            return `${index + 1}位: ${clinicName}`;
        });
    });
    
    console.log('\n🏆 比較表の実際の順序:');
    comparisonTableOrder.forEach(order => console.log(order));
    
    // CSVデータと比較
    console.log('\n📊 期待値 (CSVデータより):');
    console.log('013行目: 1,3,4,2,5');
    console.log('期待順序: 1位=ディオ, 2位=リエート, 3位=エミナル, 4位=ウララ, 5位=湘南美容');
    
    // ランキングデータを直接確認
    const rankingData = await page.evaluate(() => {
        const app = window.app;
        if (!app || !app.dataManager) return 'app not ready';
        
        const ranking = app.dataManager.rankings.find(r => r.regionId === '013');
        return ranking ? ranking.ranks : 'ranking not found';
    });
    
    console.log('\n📊 実際のランキングデータ:', rankingData);
    
    console.log('\n✅ テスト完了');
    await browser.close();
})();