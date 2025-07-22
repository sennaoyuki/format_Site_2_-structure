const { chromium } = require('playwright');

(async () => {
    console.log('=== JavaScriptファイルのURL確認 ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    const baseUrl = 'https://format-site-2-structure.vercel.app';
    const files = [
        '/app.js',
        '/data-manager.js',
        '/public/app.js',
        '/public/data-manager.js'
    ];
    
    for (const file of files) {
        const url = baseUrl + file;
        console.log(`\n📁 ${url}`);
        
        try {
            const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
            const status = response.status();
            console.log(`   ステータス: ${status}`);
            
            if (status === 200) {
                const content = await page.content();
                console.log(`   内容の最初の100文字: ${content.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   エラー: ${error.message}`);
        }
    }
    
    // index.htmlの実際のscriptタグを確認
    console.log('\n\n📋 index.htmlのscriptタグ確認:');
    
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    
    const scripts = await page.$$eval('script', elements => 
        elements.map(el => ({
            src: el.src || 'inline',
            text: el.src ? null : el.textContent.substring(0, 50)
        }))
    );
    
    scripts.forEach((script, index) => {
        console.log(`\nScript ${index + 1}:`);
        console.log(`  src: ${script.src}`);
        if (script.text) {
            console.log(`  内容: ${script.text}...`);
        }
    });
    
    await browser.close();
    console.log('\n=== 確認完了 ===');
})();