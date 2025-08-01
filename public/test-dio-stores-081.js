const { chromium } = require('playwright');

async function testDioStores() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 栄版（region_id=081）のページを開く
        console.log('栄版（region_id=081）のページを確認中...');
        await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/medical-diet001/?region_id=081', {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(3000);
        
        // ディオクリニックの詳細セクションを確認
        const dioSection = await page.$('#clinic1');
        if (dioSection) {
            console.log('✅ ディオクリニックの詳細セクションが見つかりました');
            
            // 店舗情報セクションを確認
            const storeSection = await page.$eval('#clinic1 .brand-section', section => {
                const heading = section.querySelector('.section-heading')?.textContent || '';
                const stores = Array.from(section.querySelectorAll('.shop-name')).map(el => el.textContent.trim());
                return {
                    heading,
                    stores,
                    html: section.innerHTML.substring(0, 500) // 最初の500文字
                };
            }).catch(e => null);
            
            if (storeSection && storeSection.stores.length > 0) {
                console.log('✅ 店舗情報セクション:', storeSection.heading);
                console.log('✅ 表示されている店舗:');
                storeSection.stores.forEach((store, i) => {
                    console.log(`  ${i + 1}. ${store}`);
                });
            } else {
                console.log('❌ 店舗情報が表示されていません');
                console.log('HTML:', storeSection?.html);
            }
            
            // スクリーンショットを撮影
            await dioSection.screenshot({ path: 'dio-stores-081.png' });
            console.log('📸 スクリーンショット保存: dio-stores-081.png');
            
        } else {
            console.log('❌ ディオクリニックの詳細セクションが見つかりません');
        }
        
        // コンソールエラーを確認
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ コンソールエラー:', msg.text());
            }
        });
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

testDioStores();