const { chromium } = require('playwright');

async function testSearchLink() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    // コンソールメッセージを監視
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[ブラウザエラー]:`, msg.text());
        }
    });
    
    try {
        console.log('📍 medical-diet001の検索リンクをテスト...');
        
        // HTTPサーバー経由でアクセス
        await page.goto('http://localhost:8001/public/medical-diet001/index.html');
        await page.waitForTimeout(2000);
        
        // ハンバーガーメニューを開く
        console.log('\n📍 ハンバーガーメニューを開く...');
        const hamburger = page.locator('#hamburger-menu');
        await hamburger.click();
        await page.waitForTimeout(1000);
        
        // サイドバーが開いているか確認
        const sidebarVisible = await page.locator('#sidebar-menu.active').isVisible();
        console.log(`サイドバー表示: ${sidebarVisible ? '✅' : '❌'}`);
        
        if (sidebarVisible) {
            // フィルターを設定
            console.log('\n📍 フィルターを設定...');
            
            // 地域を大阪に変更
            await page.selectOption('#sidebar-region-select', '021');
            console.log('地域: 大阪を選択');
            
            // 対応部位を設定
            await page.selectOption('#sidebar-specialty-filter', 'face');
            console.log('対応部位: 顔を選択');
            
            // 店舗数を設定
            await page.selectOption('#sidebar-hours-filter', 'medium');
            console.log('店舗数: 6〜10店舗を選択');
            
            // 検索リンクをクリック
            console.log('\n📍 詳細検索ページへのリンクをクリック...');
            await page.locator('.sidebar-search-link').click();
            
            // ページ遷移を待つ
            await page.waitForTimeout(2000);
            
            // 現在のURLを確認
            const currentUrl = page.url();
            console.log(`\n現在のURL: ${currentUrl}`);
            
            // 検索結果ページに遷移したか確認
            if (currentUrl.includes('search-results.html')) {
                console.log('✅ 検索結果ページへ遷移成功');
                
                // URLパラメータを確認
                const url = new URL(currentUrl);
                console.log('\nURLパラメータ:');
                console.log(`- region: ${url.searchParams.get('region')}`);
                console.log(`- bodyPart: ${url.searchParams.get('bodyPart')}`);
                console.log(`- storeCount: ${url.searchParams.get('storeCount')}`);
            } else {
                console.log('❌ 検索結果ページへの遷移に失敗');
            }
        }
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'search-link-test.png', fullPage: true });
        console.log('\n✅ スクリーンショットを保存しました: search-link-test.png');
        
    } catch (error) {
        console.error('\n❌ エラー発生:', error);
        await page.screenshot({ path: 'search-link-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testSearchLink();