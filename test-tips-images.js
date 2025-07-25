const { chromium } = require('playwright');

async function testTipsImages() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    try {
        console.log('📍 Tipsセクションの画像実装をテスト...');
        
        // HTTPサーバー経由でアクセス
        await page.goto('http://localhost:8001/public/index.html');
        await page.waitForTimeout(2000);
        
        // Tipsセクションまでスクロール
        await page.evaluate(() => {
            const tipsSection = document.querySelector('.tips-container');
            if (tipsSection) {
                tipsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        await page.waitForTimeout(1000);
        
        console.log('\n📍 Tips画像の確認...');
        
        // タブ1（医療痩身の効果）の画像確認
        const tips1Image = await page.locator('.tab-content[data-tab="0"] img').first();
        if (await tips1Image.isVisible()) {
            const src1 = await tips1Image.getAttribute('src');
            console.log(`Tips1画像: ${src1} - ✅`);
        } else {
            console.log('Tips1画像: ❌ 表示されていません');
        }
        
        // タブ2（クリニック選び）に切り替え
        await page.locator('.tab[data-tab="1"]').click();
        await page.waitForTimeout(500);
        
        const tips2Image = await page.locator('.tab-content[data-tab="1"] img').first();
        if (await tips2Image.isVisible()) {
            const src2 = await tips2Image.getAttribute('src');
            console.log(`Tips2画像: ${src2} - ✅`);
        } else {
            console.log('Tips2画像: ❌ 表示されていません');
        }
        
        // タブ3（今がおすすめ）に切り替え
        await page.locator('.tab[data-tab="2"]').click();
        await page.waitForTimeout(500);
        
        const tips3Image = await page.locator('.tab-content[data-tab="2"] img').first();
        if (await tips3Image.isVisible()) {
            const src3 = await tips3Image.getAttribute('src');
            console.log(`Tips3画像: ${src3} - ✅`);
        } else {
            console.log('Tips3画像: ❌ 表示されていません');
        }
        
        // スクリーンショットを撮る
        await page.screenshot({ 
            path: 'tips-images-test.png', 
            clip: {
                x: 0,
                y: 500,
                width: 1200,
                height: 600
            }
        });
        console.log('\n✅ スクリーンショットを保存しました: tips-images-test.png');
        
    } catch (error) {
        console.error('\n❌ エラー発生:', error);
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testTipsImages();