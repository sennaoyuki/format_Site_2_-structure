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
    
    console.log('🔍 クリニックIDとランキングの確認...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // クリニックIDとクリニック名の対応を確認
    const clinicData = await page.evaluate(() => {
        const app = window.app;
        if (!app || !app.dataManager) return 'app not ready';
        
        const clinics = app.dataManager.clinics;
        const ranking = app.dataManager.rankings.find(r => r.regionId === '013');
        
        return {
            clinics: clinics.map(c => ({ id: c.id, name: c.name })),
            ranking: ranking ? ranking.ranks : null
        };
    });
    
    console.log('\n🏥 クリニックIDと名前の対応:');
    clinicData.clinics.forEach(clinic => {
        console.log(`ID ${clinic.id}: ${clinic.name}`);
    });
    
    console.log('\n📊 ランキングデータ (013):');
    console.log(clinicData.ranking);
    
    console.log('\n🎯 正しい順序の解釈:');
    console.log('CSVの値 "1,3,4,2,5" を正しく解釈すると:');
    console.log('no1 = 1 → 1位はクリニックID 1 (ディオクリニック)');
    console.log('no2 = 3 → 2位はクリニックID 3 (リエートクリニック)'); 
    console.log('no3 = 4 → 3位はクリニックID 4 (エミナルクリニック)');
    console.log('no4 = 2 → 4位はクリニックID 2 (ウララクリニック)');
    console.log('no5 = 5 → 5位はクリニックID 5 (湘南美容クリニック)');
    
    await browser.close();
})();