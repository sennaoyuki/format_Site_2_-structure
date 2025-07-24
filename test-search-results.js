const { chromium } = require('playwright');

async function testSearchResults() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    try {
        console.log('📍 ステップ1: 検索結果ページを開く...');
        await page.goto('file://' + __dirname + '/public/search-results.html');
        await page.waitForTimeout(2000);
        
        // スクリーンショットを撮る
        await page.screenshot({ path: 'search-results-initial.png', fullPage: true });
        console.log('   初期表示のスクリーンショットを保存しました');
        
        // フィルター適用テスト
        console.log('\n📍 ステップ2: 対応部位フィルターを適用...');
        await page.click('input[name="body-parts"][value="face"]');
        await page.click('input[name="body-parts"][value="stomach"]');
        
        console.log('\n📍 ステップ3: 地域フィルターを適用...');
        await page.click('input[name="regions"][value="tokyo"]');
        await page.click('input[name="regions"][value="osaka"]');
        
        console.log('\n📍 ステップ4: 店舗数フィルターを適用...');
        await page.click('input[name="store-count"][value="large"]');
        
        console.log('\n📍 ステップ5: フィルターを適用...');
        await page.click('#apply-filters');
        await page.waitForTimeout(1000);
        
        // フィルター適用後のスクリーンショット
        await page.screenshot({ path: 'search-results-filtered.png', fullPage: true });
        console.log('   フィルター適用後のスクリーンショットを保存しました');
        
        // 結果件数を確認
        const resultsCount = await page.textContent('#results-count');
        console.log(`   検索結果: ${resultsCount}`);
        
        // 表示されている結果の数を確認
        const resultCards = await page.locator('.result-card').count();
        console.log(`   表示されているカード数: ${resultCards}`);
        
        // フィルタークリアテスト
        console.log('\n📍 ステップ6: フィルターをクリア...');
        await page.click('#clear-filters');
        await page.waitForTimeout(1000);
        
        const allResultsCount = await page.textContent('#results-count');
        console.log(`   全件表示: ${allResultsCount}`);
        
        console.log('\n✅ テスト完了！');
        
    } catch (error) {
        console.error('❌ エラー発生:', error);
        await page.screenshot({ path: 'search-results-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testSearchResults();