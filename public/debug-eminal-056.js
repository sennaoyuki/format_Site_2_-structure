const { chromium } = require('playwright');

async function debugEminalStores() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // コンソールログを監視
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🔍') || text.includes('📦') || text.includes('🏪') || text.includes('✅') || text.includes('店舗')) {
                console.log(`[ブラウザ] ${text}`);
            }
        });
        
        console.log('渋谷版（region_id=056）のページを開いてデバッグ中...');
        await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/medical-diet001/?region_id=056', {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(5000);
        
        // エミナルの詳細セクションのHTMLを確認
        const eminalHTML = await page.$eval('#clinic2', section => {
            const brandSection = section.querySelector('.brand-section');
            if (brandSection) {
                return {
                    heading: brandSection.querySelector('.section-heading')?.textContent || '',
                    content: brandSection.innerHTML.substring(0, 1000) // 最初の1000文字
                };
            }
            return { error: '店舗セクションが見つかりません' };
        }).catch(e => ({ error: e.message }));
        
        console.log('エミナル詳細セクション:', eminalHTML);
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

debugEminalStores();