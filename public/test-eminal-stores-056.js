const { chromium } = require('playwright');

async function testEminalStores() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 渋谷版（region_id=056）のページを開く
        console.log('渋谷版（region_id=056）のページを確認中...');
        await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/medical-diet001/?region_id=056', {
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
                    hasStores: stores.length > 0
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
            }
            
            // スクリーンショットを撮影
            await eminalSection.screenshot({ path: 'eminal-stores-056.png' });
            console.log('📸 スクリーンショット保存: eminal-stores-056.png');
            
        } else {
            console.log('❌ エミナルクリニックの詳細セクションが見つかりません');
        }
        
        // ランキング表示も確認
        const rankingSection = await page.$eval('.ranking-container', container => {
            const items = Array.from(container.querySelectorAll('.ranking-item'));
            return items.map((item, index) => {
                const clinicName = item.querySelector('.clinic-logo-section h3')?.textContent || '';
                return `${index + 1}位: ${clinicName}`;
            });
        }).catch(() => []);
        
        console.log('🏆 ランキング表示:');
        rankingSection.forEach(rank => console.log(`  ${rank}`));
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

testEminalStores();