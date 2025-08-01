const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 サイドバー問題の詳細診断\n');
    
    await page.setViewportSize({ width: 500, height: 1000 });
    
    await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // サイドバーの詳細情報を取得
    const sidebarDetails = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-menu');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (!sidebar) return { error: 'サイドバーが見つかりません' };
        
        const rect = sidebar.getBoundingClientRect();
        const styles = window.getComputedStyle(sidebar);
        
        // 実際に画面に表示されているかの判定
        const isReallyVisible = (
            rect.left < window.innerWidth && // 左端が画面内
            rect.right > 0 && // 右端が画面内
            rect.width > 0 && // 幅がある
            styles.display !== 'none' && // displayがnoneでない
            styles.visibility !== 'hidden' // visibilityがhiddenでない
        );
        
        return {
            className: sidebar.className,
            classList: Array.from(sidebar.classList),
            boundingRect: {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                height: rect.height
            },
            computedStyles: {
                position: styles.position,
                right: styles.right,
                left: styles.left,
                width: styles.width,
                display: styles.display,
                visibility: styles.visibility,
                transform: styles.transform,
                transition: styles.transition,
                zIndex: styles.zIndex
            },
            isReallyVisible,
            viewportWidth: window.innerWidth,
            // オーバーレイの状態
            overlay: overlay ? {
                classList: Array.from(overlay.classList),
                display: window.getComputedStyle(overlay).display,
                visibility: window.getComputedStyle(overlay).visibility
            } : null
        };
    });
    
    console.log('📋 サイドバーの詳細情報:');
    console.log(`  クラス名: ${sidebarDetails.classList.join(' ')}`);
    console.log(`  実際の表示: ${sidebarDetails.isReallyVisible ? '⚠️ されている' : '✅ されていない'}`);
    
    console.log('\n📐 位置情報:');
    console.log(`  left: ${sidebarDetails.boundingRect.left}px`);
    console.log(`  right: ${sidebarDetails.boundingRect.right}px`);
    console.log(`  width: ${sidebarDetails.boundingRect.width}px`);
    console.log(`  ビューポート幅: ${sidebarDetails.viewportWidth}px`);
    
    console.log('\n🎨 スタイル情報:');
    Object.entries(sidebarDetails.computedStyles).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    if (sidebarDetails.overlay) {
        console.log('\n🔳 オーバーレイの状態:');
        console.log(`  クラス: ${sidebarDetails.overlay.classList.join(' ')}`);
        console.log(`  display: ${sidebarDetails.overlay.display}`);
        console.log(`  visibility: ${sidebarDetails.overlay.visibility}`);
    }
    
    // 画面内の要素をスクリーンショット
    await page.screenshot({ 
        path: 'sidebar-diagnosis-500px.png', 
        clip: { x: 0, y: 0, width: 500, height: 800 }
    });
    
    console.log('\n📸 診断用スクリーンショット: sidebar-diagnosis-500px.png');
    
    await browser.close();
})();