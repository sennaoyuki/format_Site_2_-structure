const { chromium } = require('playwright');

async function testEminalWithCacheClear() {
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
        
        console.log('キャッシュクリア後、渋谷版（region_id=056）のページを確認中...');
        console.log('URL:', url);
        
        // コンソールログを監視
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🔍') || text.includes('📦') || text.includes('🏪') || text.includes('✅') || text.includes('店舗')) {
                console.log(`[ブラウザ] ${text}`);
            }
        });
        
        await page.goto(url, {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(3000);
        
        // エミナルクリニックの詳細セクションを確認（2位）
        const eminalSection = await page.$('#clinic2');
        if (eminalSection) {
            console.log('✅ エミナルクリニックの詳細セクションが見つかりました');
            
            // 店舗情報セクションを確認
            const storeSection = await page.$eval('#clinic2 .brand-section', section => {
                const heading = section.querySelector('.section-heading')?.textContent || '';
                const stores = Array.from(section.querySelectorAll('.shop-name')).map(el => el.textContent.trim());
                return {
                    heading,
                    stores,
                    hasStores: stores.length > 0,
                    html: section.innerHTML.substring(0, 500)
                };
            }).catch(e => ({ hasStores: false, error: e.message }));
            
            if (storeSection.hasStores) {
                console.log('✅ 店舗情報セクション:', storeSection.heading);
                console.log('✅ 表示されている店舗:');
                storeSection.stores.forEach((store, i) => {
                    console.log(`  ${i + 1}. ${store}`);
                });
            } else {
                console.log('❌ 店舗情報が表示されていません');
                console.log('エラー:', storeSection.error || '不明');
                console.log('HTML:', storeSection.html || 'HTMLなし');
            }
            
            // スクリーンショットを撮影
            await eminalSection.screenshot({ path: 'eminal-stores-056-cache-clear.png' });
            console.log('📸 スクリーンショット保存: eminal-stores-056-cache-clear.png');
            
        } else {
            console.log('❌ エミナルクリニックの詳細セクションが見つかりません');
        }
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

testEminalWithCacheClear();