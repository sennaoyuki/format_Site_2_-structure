const { chromium } = require('playwright');

(async () => {
    console.log('=== コンソールでランキング問題を診断 ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // コンソールログを監視
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ コンソールエラー:', msg.text());
        }
    });
    
    await page.goto('https://format-site-2-structure.vercel.app/', {
        waitUntil: 'networkidle'
    });
    
    // app.jsの読み込み状態を確認
    const appStatus = await page.evaluate(() => {
        const results = {
            rankingApp: typeof window.RankingApp !== 'undefined',
            dataManager: typeof window.dataManager !== 'undefined',
            rankingList: document.getElementById('ranking-list'),
            rankingListContent: document.getElementById('ranking-list')?.innerHTML || 'なし',
            hasRankingItems: document.querySelectorAll('.ranking-item').length
        };
        
        // RankingAppのインスタンスを確認
        if (typeof window.RankingApp !== 'undefined') {
            try {
                // アプリケーションを初期化
                const app = new window.RankingApp();
                app.init();
                results.appInitialized = true;
            } catch (error) {
                results.initError = error.message;
            }
        }
        
        return results;
    });
    
    console.log('📊 アプリケーション状態:');
    console.log('- RankingApp クラス:', appStatus.rankingApp ? '✅' : '❌');
    console.log('- dataManager:', appStatus.dataManager ? '✅' : '❌');
    console.log('- ranking-list要素:', appStatus.rankingList ? '✅' : '❌');
    console.log('- ランキングアイテム数:', appStatus.hasRankingItems);
    console.log('- ranking-listの内容:', appStatus.rankingListContent.substring(0, 100) + '...');
    
    if (appStatus.initError) {
        console.log('- 初期化エラー:', appStatus.initError);
    }
    
    // 少し待ってから再確認
    await page.waitForTimeout(3000);
    
    const afterWait = await page.evaluate(() => {
        return {
            rankingItems: document.querySelectorAll('.ranking-item').length,
            dataManagerClinics: window.dataManager ? window.dataManager.getAllClinics().length : 0
        };
    });
    
    console.log('\n⏱️ 3秒後の状態:');
    console.log('- ランキングアイテム数:', afterWait.rankingItems);
    console.log('- データマネージャーのクリニック数:', afterWait.dataManagerClinics);
    
    // タブ切り替えの問題を診断
    console.log('\n🔄 タブ切り替えの診断:');
    
    // JavaScriptで直接タブを切り替え
    const tabResult = await page.evaluate(() => {
        const tab2 = document.querySelector('.tab-menu-item[data-tab="tab2"]');
        if (tab2) {
            tab2.click();
            return {
                clicked: true,
                activeTab: document.querySelector('.js-cbn-table').getAttribute('data-active-tab')
            };
        }
        return { clicked: false };
    });
    
    console.log('- tab2クリック:', tabResult.clicked ? '✅' : '❌');
    console.log('- 現在のアクティブタブ:', tabResult.activeTab);
    
    await browser.close();
    console.log('\n=== 診断完了 ===');
})();