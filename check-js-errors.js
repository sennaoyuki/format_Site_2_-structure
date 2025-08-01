const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // コンソールメッセージを監視
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
    });
    
    // ページエラーを監視
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            stack: error.stack
        });
    });
    
    console.log('🔍 JavaScriptエラーチェック開始...');
    
    await page.goto(`http://localhost:8090/draft/?region_id=013&t=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // JavaScriptエラーログを表示
    console.log('\n❌ ページエラー:', pageErrors.length);
    pageErrors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log('Message:', error.message);
        console.log('Stack:', error.stack);
    });
    
    // コンソールエラーのみ表示
    const errors = consoleLogs.filter(log => log.type === 'error');
    console.log('\n❌ コンソールエラー:', errors.length);
    errors.forEach((log, index) => {
        console.log(`\nConsole Error ${index + 1}:`);
        console.log('Text:', log.text);
        console.log('Location:', log.location);
    });
    
    // セクションの表示状態を確認
    const sectionVisibility = await page.evaluate(() => {
        const checkVisibility = (selector) => {
            const element = document.querySelector(selector);
            if (!element) return 'not found';
            
            const styles = window.getComputedStyle(element);
            return {
                exists: true,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                height: element.offsetHeight,
                hidden: element.hidden
            };
        };
        
        return {
            details: checkVisibility('.clinic-details-section'),
            columns: checkVisibility('.medical-columns-section'),
            footer: checkVisibility('#footer')
        };
    });
    
    console.log('\n📊 セクション表示状態:');
    console.log(JSON.stringify(sectionVisibility, null, 2));
    
    console.log('\n⏳ ブラウザを開いたままにします...');
    // ブラウザは開いたままにする
})();