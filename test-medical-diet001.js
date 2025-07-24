const { chromium } = require('playwright');

async function testMedicalDiet001() {
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
    
    // ネットワークエラーを監視
    page.on('requestfailed', request => {
        console.log(`[ネットワークエラー]: ${request.url()} - ${request.failure().errorText}`);
    });
    
    try {
        console.log('📍 medical-diet001ディレクトリをテスト...');
        
        // ローカルファイルを開く
        await page.goto(`file://${process.cwd()}/public/medical-diet001/index.html`);
        await page.waitForTimeout(2000);
        
        // ページタイトルの確認
        const title = await page.title();
        console.log(`\nページタイトル: ${title}`);
        
        // メインビジュアルの確認
        const heroImage = await page.locator('.hero-image').isVisible();
        console.log(`メインビジュアル表示: ${heroImage ? '✅' : '❌'}`);
        
        // CSSが適用されているか確認
        const headerBgColor = await page.locator('.site-header').evaluate(el => {
            return window.getComputedStyle(el).backgroundColor;
        });
        console.log(`ヘッダー背景色: ${headerBgColor}`);
        
        // JavaScriptが動作しているか確認
        console.log('\n📍 JavaScript動作確認...');
        
        // DataManagerの存在確認
        const hasDataManager = await page.evaluate(() => {
            return typeof window.dataManager !== 'undefined';
        });
        console.log(`DataManager存在: ${hasDataManager ? '✅' : '❌'}`);
        
        // ランキング表示の確認
        await page.waitForTimeout(3000); // データ読み込みを待つ
        
        const rankingCards = await page.locator('.ranking-item').count();
        console.log(`ランキングカード数: ${rankingCards}`);
        
        if (rankingCards > 0) {
            const firstClinicName = await page.locator('.ranking-item .clinic-logo-section').first().textContent();
            console.log(`1位のクリニック: ${firstClinicName?.trim()}`);
        }
        
        // 画像パスの確認
        console.log('\n📍 画像パスの確認...');
        const images = await page.locator('img').all();
        for (let i = 0; i < Math.min(3, images.length); i++) {
            const src = await images[i].getAttribute('src');
            console.log(`画像${i + 1}: ${src}`);
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
                await page.locator('#sidebar-close').click();
                await page.waitForTimeout(1000);
            }
        }
        
        // 詳細セクションの確認
        console.log('\n📍 詳細セクションの確認...');
        const detailsVisible = await page.locator('.clinic-details-section').isVisible();
        console.log(`詳細セクション表示: ${detailsVisible ? '✅' : '❌'}`);
        
        const detailItems = await page.locator('.detail-item').count();
        console.log(`詳細アイテム数: ${detailItems}`);
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'medical-diet001-test.png', fullPage: true });
        console.log('\n✅ スクリーンショットを保存しました: medical-diet001-test.png');
        
    } catch (error) {
        console.error('\n❌ エラー発生:', error);
        await page.screenshot({ path: 'medical-diet001-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testMedicalDiet001();