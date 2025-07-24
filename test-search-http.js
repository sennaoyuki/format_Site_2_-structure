const { chromium } = require('playwright');

async function testSearchResults() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 300
    });
    const page = await browser.newPage();
    
    // コンソールメッセージを監視
    page.on('console', msg => {
        console.log(`[ブラウザコンソール ${msg.type()}]:`, msg.text());
    });
    
    try {
        console.log('📍 検索結果ページを開く...');
        await page.goto('http://localhost:8002/search-results.html');
        await page.waitForTimeout(3000);
        
        // 初期表示のスクリーンショット
        await page.screenshot({ path: 'search-initial.png', fullPage: true });
        console.log('初期表示のスクリーンショットを保存しました');
        
        // 検索結果の件数を確認
        const resultsCount = await page.textContent('#results-count');
        console.log(`検索結果: ${resultsCount}`);
        
        // フィルターテスト
        console.log('\n📍 フィルターを適用...');
        
        // 対応部位: お腹を選択（全クリニックが対応）
        await page.click('input[value="stomach"]');
        
        // 地域: 東京を選択（複数のクリニックが対応）
        await page.click('input[value="tokyo"]');
        
        // 店舗数: それ以上を選択（20店舗以上）
        await page.click('input[value="xlarge"]');
        
        // フィルターを適用
        await page.click('#apply-filters');
        await page.waitForTimeout(1000);
        
        // フィルター適用後の結果
        const filteredCount = await page.textContent('#results-count');
        console.log(`フィルター適用後: ${filteredCount}`);
        
        await page.screenshot({ path: 'search-filtered.png', fullPage: true });
        console.log('フィルター適用後のスクリーンショットを保存しました');
        
        console.log('\n✅ テスト完了！');
        
    } catch (error) {
        console.error('❌ エラー発生:', error);
        await page.screenshot({ path: 'search-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testSearchResults();