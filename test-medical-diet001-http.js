const { chromium } = require('playwright');

async function testMedicalDiet001HTTP() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    // コンソールエラーを監視
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[ブラウザエラー]:`, msg.text());
        }
    });
    
    try {
        console.log('📍 medical-diet001ディレクトリをHTTPでテスト...');
        
        // HTTPサーバー経由でアクセス
        await page.goto('http://localhost:8001/public/medical-diet001/index.html');
        await page.waitForTimeout(3000);
        
        // ページタイトルの確認
        const title = await page.title();
        console.log(`\nページタイトル: ${title}`);
        
        // CSSが適用されているか確認
        const headerBgColor = await page.locator('.site-header').evaluate(el => {
            return window.getComputedStyle(el).backgroundColor;
        });
        console.log(`ヘッダー背景色: ${headerBgColor} (白以外ならCSS適用済み)`);
        
        // JavaScriptが動作しているか確認
        console.log('\n📍 JavaScript動作確認...');
        
        // SITE_CONFIGの確認
        const siteConfig = await page.evaluate(() => window.SITE_CONFIG);
        console.log('SITE_CONFIG:', siteConfig);
        
        // DataManagerの存在確認
        const hasDataManager = await page.evaluate(() => {
            return typeof window.dataManager !== 'undefined';
        });
        console.log(`DataManager存在: ${hasDataManager ? '✅' : '❌'}`);
        
        // ランキング表示の確認
        await page.waitForTimeout(2000); // データ読み込みを待つ
        
        const rankingCards = await page.locator('.ranking-item').count();
        console.log(`ランキングカード数: ${rankingCards}`);
        
        if (rankingCards > 0) {
            const firstClinicName = await page.locator('.ranking-item .clinic-logo-section').first().textContent();
            console.log(`1位のクリニック: ${firstClinicName?.trim()}`);
            
            // 画像が正しく表示されているか確認
            const firstImage = await page.locator('.ranking-item img').first();
            const imageSrc = await firstImage.getAttribute('src');
            console.log(`1位の画像パス: ${imageSrc}`);
        }
        
        // ハンバーガーメニューの動作確認
        console.log('\n📍 ハンバーガーメニューテスト...');
        const hamburger = page.locator('#hamburger-menu');
        if (await hamburger.isVisible()) {
            await hamburger.click();
            await page.waitForTimeout(1000);
            
            const sidebarVisible = await page.locator('#sidebar.active').isVisible();
            console.log(`サイドバー表示: ${sidebarVisible ? '✅' : '❌'}`);
            
            if (sidebarVisible) {
                // 地域選択の確認
                const regionSelect = page.locator('#sidebar-region-filter');
                const regionOptions = await regionSelect.locator('option').count();
                console.log(`地域オプション数: ${regionOptions}`);
                
                await page.locator('#sidebar-close').click();
                await page.waitForTimeout(1000);
            }
        }
        
        // 詳細セクションの確認
        console.log('\n📍 詳細セクションの確認...');
        const detailItems = await page.locator('.detail-item').count();
        console.log(`詳細アイテム数: ${detailItems}`);
        
        if (detailItems > 0) {
            // 店舗画像の確認
            const storeImage = await page.locator('.detail-item .shop-image img').first();
            if (await storeImage.isVisible()) {
                const storeImageSrc = await storeImage.getAttribute('src');
                console.log(`店舗画像パス: ${storeImageSrc}`);
            }
        }
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'medical-diet001-http-test.png', fullPage: true });
        console.log('\n✅ スクリーンショットを保存しました: medical-diet001-http-test.png');
        
    } catch (error) {
        console.error('\n❌ エラー発生:', error);
        await page.screenshot({ path: 'medical-diet001-http-error.png' });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
        
        // HTTPサーバーを停止
        console.log('\n📍 HTTPサーバーを停止...');
        require('child_process').execSync('lsof -ti:8001 | xargs kill -9 2>/dev/null || true');
    }
}

testMedicalDiet001HTTP();