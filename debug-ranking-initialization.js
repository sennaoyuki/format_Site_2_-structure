const { chromium } = require('playwright');

(async () => {
    console.log('=== ランキング初期化の詳細デバッグ ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // すべてのコンソールメッセージを表示
    page.on('console', msg => {
        console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    // エラーを捕捉
    page.on('pageerror', error => {
        console.log('❌ ページエラー:', error.message);
    });
    
    await page.goto('https://format-site-2-structure.vercel.app/', {
        waitUntil: 'networkidle'
    });
    
    // DOMContentLoadedイベント後の状態を確認
    const initialization = await page.evaluate(() => {
        const results = {
            domReady: document.readyState,
            rankingAppExists: typeof RankingApp !== 'undefined',
            dataManagerExists: typeof DataManager !== 'undefined',
            windowRankingApp: typeof window.RankingApp !== 'undefined',
            windowDataManager: typeof window.DataManager !== 'undefined'
        };
        
        // 手動で初期化を試みる
        if (typeof RankingApp !== 'undefined') {
            try {
                console.log('RankingAppを初期化中...');
                const app = new RankingApp();
                app.init();
                results.manualInitSuccess = true;
            } catch (error) {
                results.manualInitError = error.message;
                console.error('初期化エラー:', error);
            }
        } else {
            console.error('RankingAppクラスが見つかりません');
        }
        
        return results;
    });
    
    console.log('\n📊 初期化状態:');
    console.log(JSON.stringify(initialization, null, 2));
    
    // 2秒待って再確認
    await page.waitForTimeout(2000);
    
    const afterInit = await page.evaluate(() => {
        return {
            rankingItems: document.querySelectorAll('.ranking-item').length,
            rankingListHTML: document.getElementById('ranking-list')?.innerHTML.substring(0, 200)
        };
    });
    
    console.log('\n⏱️ 初期化後の状態:');
    console.log('- ランキングアイテム数:', afterInit.rankingItems);
    console.log('- ranking-listの内容:', afterInit.rankingListHTML);
    
    // app.jsの初期化コードを確認
    console.log('\n🔍 app.js初期化コードの確認:');
    
    const hasInitCode = await page.evaluate(() => {
        // スクリプトタグを探す
        const scripts = Array.from(document.querySelectorAll('script'));
        const appInitScript = scripts.find(s => s.textContent.includes('new RankingApp()'));
        return {
            hasAppInit: !!appInitScript,
            scriptContent: appInitScript?.textContent.substring(0, 200)
        };
    });
    
    console.log('- app初期化コード:', hasInitCode.hasAppInit ? '✅ 見つかりました' : '❌ 見つかりません');
    if (hasInitCode.scriptContent) {
        console.log('- 内容:', hasInitCode.scriptContent);
    }
    
    await browser.close();
    console.log('\n=== デバッグ完了 ===');
})();