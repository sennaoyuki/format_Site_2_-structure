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
    
    console.log('🎯 最終検証: 出しわけ設定が正しく動作しているか確認...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // 比較表の順序を確認
    const actualOrder = await page.evaluate(() => {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return [];
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        return rows.map((row, index) => {
            const clinicLink = row.querySelector('.clinic-link');
            const clinicName = clinicLink ? clinicLink.textContent.trim() : 'Unknown';
            return `${index + 1}位: ${clinicName}`;
        });
    });
    
    // CSVから期待される順序
    const expectedOrder = [
        '1位: ディオクリニック',      // CSV no1 = 1
        '2位: ウララクリニック',      // CSV no2 = 3  
        '3位: リエートクリニック',    // CSV no3 = 4
        '4位: エミナルクリニック',    // CSV no4 = 2
        '5位: 湘南美容クリニック'     // CSV no5 = 5
    ];
    
    console.log('\n📊 CSV データ (013行目): 1,3,4,2,5');
    console.log('🎯 期待される順序:', expectedOrder);
    console.log('📋 実際の表示順序:', actualOrder);
    
    // 検証
    let isCorrect = true;
    for (let i = 0; i < expectedOrder.length; i++) {
        if (actualOrder[i] !== expectedOrder[i]) {
            console.log(`❌ ${i + 1}位が不一致: 期待=${expectedOrder[i]}, 実際=${actualOrder[i]}`);
            isCorrect = false;
        } else {
            console.log(`✅ ${i + 1}位が一致: ${actualOrder[i]}`);
        }
    }
    
    if (isCorrect) {
        console.log('\n🎉 SUCCESS: 出しわけ設定が正しく動作しています！');
    } else {
        console.log('\n❌ ERROR: 出しわけ設定に問題があります');
    }
    
    // 他の地域でも簡単にテスト
    console.log('\n🔍 他の地域もテスト中...');
    
    await page.goto('http://localhost:8090/draft/?region_id=001', {
        waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);
    
    const order001 = await page.evaluate(() => {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return [];
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        return rows.map((row, index) => {
            const clinicLink = row.querySelector('.clinic-link');
            const clinicName = clinicLink ? clinicLink.textContent.trim() : 'Unknown';
            return `${index + 1}位: ${clinicName}`;
        });
    });
    
    console.log('\n📊 CSV データ (001行目): 1,2,5,-,-');
    console.log('🎯 期待される順序: 1位=ディオ, 2位=エミナル, 3位=湘南美容');
    console.log('📋 実際の表示順序:', order001);
    
    await browser.close();
})();