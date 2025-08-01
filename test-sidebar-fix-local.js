const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 サイドバー修正後のローカルテスト\n');
    
    await page.setViewportSize({ width: 500, height: 1000 });
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(1000);
    
    const sidebarInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-menu');
        if (!sidebar) return { found: false };
        
        const rect = sidebar.getBoundingClientRect();
        const styles = window.getComputedStyle(sidebar);
        
        return {
            width: styles.width,
            right: styles.right,
            position: rect.right,
            isVisible: rect.left < window.innerWidth && rect.right > 0
        };
    });
    
    console.log('📋 サイドバーの状態:');
    console.log(`  幅: ${sidebarInfo.width}`);
    console.log(`  right: ${sidebarInfo.right}`);
    console.log(`  表示: ${sidebarInfo.isVisible ? '⚠️ されている' : '✅ されていない'}`);
    
    if (sidebarInfo.width === '300px' && sidebarInfo.right === '-300px') {
        console.log('\n✅ サイドバーの問題が修正されました！');
    } else {
        console.log('\n⚠️ まだ問題があります');
    }
    
    await browser.close();
})();