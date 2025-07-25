const { chromium } = require('playwright');

async function testSearchFilters() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    // コンソールメッセージを監視
    page.on('console', msg => {
        console.log(`[ブラウザ]:`, msg.text());
    });
    
    try {
        console.log('📍 検索フィルターのテスト...');
        
        // 直接検索結果ページにアクセス（パラメータ付き）
        await page.goto('http://localhost:8001/public/search-results.html?region=021&bodyPart=face&storeCount=medium');
        await page.waitForTimeout(3000);
        
        // 検索結果を確認
        const resultsCount = await page.locator('#results-count').textContent();
        console.log(`\n検索結果: ${resultsCount}`);
        
        // フィルターが正しく設定されているか確認
        console.log('\n📍 フィルターの状態を確認...');
        
        // 地域フィルター（大阪）
        const osakaChecked = await page.locator('input[name="regions"][value="021"]').isChecked();
        console.log(`大阪フィルター: ${osakaChecked ? '✅' : '❌'}`);
        
        // 対応部位フィルター（顔）
        const faceChecked = await page.locator('input[name="body-parts"][value="face"]').isChecked();
        console.log(`顔フィルター: ${faceChecked ? '✅' : '❌'}`);
        
        // 店舗数フィルター（6〜10店舗）
        const mediumChecked = await page.locator('input[name="store-count"][value="medium"]').isChecked();
        console.log(`6〜10店舗フィルター: ${mediumChecked ? '✅' : '❌'}`);
        
        // 表示されているクリニック数
        const clinicCards = await page.locator('.result-card').count();
        console.log(`\n表示されているクリニック数: ${clinicCards}`);
        
        if (clinicCards > 0) {
            // 最初のクリニックの情報を取得
            const firstClinicName = await page.locator('.result-card .clinic-name').first().textContent();
            const firstClinicRegion = await page.locator('.result-card .clinic-region').first().textContent();
            console.log(`\n最初のクリニック:`);
            console.log(`- 名前: ${firstClinicName}`);
            console.log(`- 地域: ${firstClinicRegion}`);
        } else {
            console.log('\n⚠️ 検索結果が0件です');
            
            // デバッグ情報を取得
            const noResultsVisible = await page.locator('#no-results').isVisible();
            console.log(`「検索結果なし」表示: ${noResultsVisible ? '✅' : '❌'}`);
        }
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'search-filters-test.png', fullPage: true });
        console.log('\n✅ スクリーンショットを保存しました: search-filters-test.png');
        
    } catch (error) {
        console.error('\n❌ エラー発生:', error);
        await page.screenshot({ path: 'search-filters-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testSearchFilters();