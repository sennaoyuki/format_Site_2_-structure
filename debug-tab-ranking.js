const { chromium } = require('playwright');

(async () => {
    console.log('=== タブ切り替えとランキング表示のデバッグ ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://format-site-2-structure.vercel.app/', {
        waitUntil: 'networkidle'
    });
    
    console.log('1️⃣ ランキングセクションの確認\n');
    
    // ランキングセクションの存在確認
    const rankingSection = await page.$('#ranking-section');
    if (rankingSection) {
        console.log('✅ ランキングセクションが存在します');
        
        // ランキングリストの内容確認
        const rankingItems = await page.$$eval('#ranking-list .ranking-item', elements => 
            elements.map(el => ({
                rank: el.className.match(/rank-(\d+)/)?.[1] || 'unknown',
                clinicName: el.querySelector('.clinic-info h3')?.textContent || 'なし',
                visible: window.getComputedStyle(el).display !== 'none'
            }))
        );
        
        console.log('\nランキングアイテム数:', rankingItems.length);
        rankingItems.forEach(item => {
            console.log(`- ${item.rank}位: ${item.clinicName} (表示: ${item.visible ? 'YES' : 'NO'})`);
        });
    } else {
        console.log('❌ ランキングセクションが見つかりません');
    }
    
    console.log('\n2️⃣ 比較表のタブ切り替えテスト\n');
    
    // 比較表までスクロール
    await page.evaluate(() => {
        document.querySelector('.js-cbn-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(1000);
    
    const tabs = ['tab1', 'tab2', 'tab3'];
    
    for (const tabId of tabs) {
        console.log(`\n--- ${tabId} をクリック ---`);
        
        // タブをクリック
        await page.click(`.tab-menu-item[data-tab="${tabId}"]`);
        await page.waitForTimeout(500);
        
        // 現在のdata-active-tab属性を確認
        const activeTab = await page.$eval('.js-cbn-table', el => el.getAttribute('data-active-tab'));
        console.log(`data-active-tab: ${activeTab}`);
        
        // 表示されている列数を確認
        const visibleColumns = await page.$$eval(
            '.js-cbn-table tbody tr:first-child td',
            elements => elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            }).length
        );
        console.log(`表示列数: ${visibleColumns}`);
        
        // エラーの有無を確認
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        
        if (errors.length > 0) {
            console.log('⚠️ JavaScriptエラー:', errors);
        }
    }
    
    console.log('\n3️⃣ app.jsの読み込み確認\n');
    
    // app.jsが読み込まれているか確認
    const appJsLoaded = await page.evaluate(() => {
        return typeof window.RankingApp !== 'undefined';
    });
    console.log(`RankingApp クラス: ${appJsLoaded ? '✅ 読み込み済み' : '❌ 未読み込み'}`);
    
    // dataManagerの確認
    const dataManagerLoaded = await page.evaluate(() => {
        return typeof window.dataManager !== 'undefined';
    });
    console.log(`dataManager: ${dataManagerLoaded ? '✅ 読み込み済み' : '❌ 未読み込み'}`);
    
    await browser.close();
    console.log('\n=== デバッグ完了 ===');
})();