const { chromium } = require('playwright');

async function debugStoreViews() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // キャッシュをクリア
        await context.clearCookies();
        await page.goto('about:blank');
        
        // タイムスタンプ付きでページを開く
        const timestamp = Date.now();
        const url = `https://www.xn--ecki4eoz3204ct89aepry34c.com/medical-diet001/?region_id=056&t=${timestamp}`;
        
        console.log('StoreViewsデータのデバッグ中...');
        console.log('URL:', url);
        
        await page.goto(url, {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(3000);
        
        // storeViewsの詳細データを確認
        const storeViewsData = await page.evaluate(() => {
            if (!window.dataManager || !window.dataManager.storeViews) {
                return { error: 'dataManager.storeViews is not available' };
            }
            
            // 056のstoreViewsデータを取得
            const storeView056 = window.dataManager.storeViews.find(sv => sv.regionId === '056');
            
            return {
                storeViewsLength: window.dataManager.storeViews.length,
                storeView056: storeView056,
                allRegionIds: window.dataManager.storeViews.slice(0, 10).map(sv => sv.regionId), // 最初の10個のregionId
                sampleStoreViews: window.dataManager.storeViews.slice(0, 3) // 最初の3個のサンプル
            };
        });
        
        console.log('StoreViews データ:');
        console.log('- 総数:', storeViewsData.storeViewsLength);
        console.log('- 056のデータ:', JSON.stringify(storeViewsData.storeView056, null, 2));
        console.log('- サンプルregionIds:', storeViewsData.allRegionIds);
        console.log('- サンプルデータ:', JSON.stringify(storeViewsData.sampleStoreViews, null, 2));
        
        // getStoresByRegionIdメソッドを直接テスト
        const storesByRegion = await page.evaluate(() => {
            if (!window.dataManager) {
                return { error: 'dataManager not available' };
            }
            
            try {
                const stores = window.dataManager.getStoresByRegionId('056');
                return {
                    stores: stores,
                    storesLength: stores ? stores.length : 0
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('getStoresByRegionId(056) の結果:');
        console.log(JSON.stringify(storesByRegion, null, 2));
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

debugStoreViews();