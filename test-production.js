const { chromium } = require('playwright');

async function testProduction() {
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
        console.log('📍 本番環境のページを開く...');
        // Vercelのデプロイメント環境と思われるURL
        await page.goto('https://format-site-2-structure.vercel.app/');
        await page.waitForTimeout(3000);
        
        // ランキングカードの存在確認
        console.log('\n📍 ランキングセクションの確認...');
        const rankingCards = await page.locator('.ranking-item').count();
        console.log(`ランキングカード数: ${rankingCards}`);
        
        if (rankingCards > 0) {
            // 最初のカードの内容を確認
            const firstCardName = await page.locator('.ranking-item .clinic-logo-section').first().textContent();
            console.log(`1位のクリニック: ${firstCardName?.trim()}`);
        }
        
        // 詳細セクションまでスクロール
        console.log('\n📍 詳細セクションの確認...');
        await page.evaluate(() => {
            const detailsSection = document.querySelector('.clinic-details-section');
            if (detailsSection) {
                detailsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        await page.waitForTimeout(2000);
        
        // 詳細セクションの存在確認
        const detailItems = await page.locator('.detail-item').count();
        console.log(`詳細アイテム数: ${detailItems}`);
        
        // バナー画像の確認
        const banners = await page.locator('.detail-banner img').count();
        console.log(`バナー画像数: ${banners}`);
        
        if (banners > 0) {
            const firstBannerSrc = await page.locator('.detail-banner img').first().getAttribute('src');
            console.log(`最初のバナー: ${firstBannerSrc}`);
        }
        
        // 比較テーブルの確認
        console.log('\n📍 比較テーブルの確認...');
        const tableVisible = await page.locator('.comparison-table').isVisible();
        console.log(`比較テーブル表示: ${tableVisible ? '✅ 表示されている' : '❌ 表示されていない'}`);
        
        // タブの確認
        const tabs = await page.locator('.tab-button').count();
        console.log(`タブ数: ${tabs}`);
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'production-test.png', fullPage: true });
        console.log('\n✅ スクリーンショットを保存しました');
        
        // エラーの確認
        const errorMessage = await page.locator('#error-message').isVisible();
        if (errorMessage) {
            const errorText = await page.locator('#error-text').textContent();
            console.log(`\n⚠️ エラーメッセージ: ${errorText}`);
        }
        
        console.log('\n✅ テスト完了！');
        
    } catch (error) {
        console.error('❌ エラー発生:', error);
        await page.screenshot({ path: 'production-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testProduction();