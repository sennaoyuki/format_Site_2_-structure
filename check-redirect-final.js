const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 リダイレクトページ最終確認...');
    
    // DIOリダイレクトページ
    await page.goto('http://localhost:8090/draft/go/dio/', {
        waitUntil: 'domcontentloaded'
    });
    
    // ページが読み込まれるのを待つ
    await page.waitForTimeout(1000);
    
    // baseUrl変数をチェック
    const dioConfig = await page.evaluate(() => {
        // スクリプト内のbaseUrl変数を探す
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            const content = script.textContent;
            if (content && content.includes('baseUrl')) {
                const match = content.match(/const baseUrl = ([^;]+);/);
                if (match) {
                    return {
                        found: true,
                        content: match[1].trim(),
                        hasCentralConfig: content.includes('window.CLINIC_URLS')
                    };
                }
            }
        }
        return { found: false };
    });
    
    console.log('\nDIO リダイレクトページ:');
    console.log('- baseUrl設定:', dioConfig.found ? '✅' : '❌');
    console.log('- 中央管理使用:', dioConfig.hasCentralConfig ? '✅' : '❌');
    console.log('- 実際の値:', dioConfig.content);
    
    // エミナルも確認
    await page.goto('http://localhost:8090/draft/go/eminal/', {
        waitUntil: 'domcontentloaded'
    });
    
    await page.waitForTimeout(1000);
    
    const eminalConfig = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            const content = script.textContent;
            if (content && content.includes('baseUrl')) {
                const match = content.match(/const baseUrl = ([^;]+);/);
                if (match) {
                    return {
                        found: true,
                        content: match[1].trim(),
                        hasCentralConfig: content.includes('window.CLINIC_URLS')
                    };
                }
            }
        }
        return { found: false };
    });
    
    console.log('\nエミナル リダイレクトページ:');
    console.log('- baseUrl設定:', eminalConfig.found ? '✅' : '❌');
    console.log('- 中央管理使用:', eminalConfig.hasCentralConfig ? '✅' : '❌');
    console.log('- 実際の値:', eminalConfig.content);
    
    console.log('\n✅ 確認完了');
    await browser.close();
})();