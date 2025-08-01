const { chromium } = require('playwright');

async function checkSidebarAtWidth(page, width) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(500);
    
    const sidebarInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-menu');
        const overlay = document.querySelector('.sidebar-overlay');
        const hamburger = document.querySelector('.hamburger-menu');
        
        if (!sidebar) return { found: false };
        
        const rect = sidebar.getBoundingClientRect();
        const styles = window.getComputedStyle(sidebar);
        
        return {
            found: true,
            hasActiveClass: sidebar.classList.contains('active'),
            right: styles.right,
            transform: styles.transform,
            display: styles.display,
            visibility: styles.visibility,
            position: rect.right,
            isVisible: rect.right > 0 && rect.right <= window.innerWidth,
            overlayActive: overlay ? overlay.classList.contains('active') : false,
            hamburgerActive: hamburger ? hamburger.classList.contains('active') : false,
            computedStyles: {
                width: styles.width,
                height: styles.height,
                zIndex: styles.zIndex
            }
        };
    });
    
    return sidebarInfo;
}

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 481〜768pxでのサイドバー状態をチェック\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    const widths = [481, 550, 600, 650, 700, 768];
    let hasIssue = false;
    
    for (const width of widths) {
        console.log(`\n📱 ${width}px での確認:`);
        const info = await checkSidebarAtWidth(page, width);
        
        if (!info.found) {
            console.log('  ❌ サイドバーが見つかりません');
            continue;
        }
        
        console.log(`  Active クラス: ${info.hasActiveClass ? '⚠️ あり' : '✅ なし'}`);
        console.log(`  right の値: ${info.right}`);
        console.log(`  実際の位置: ${info.position}px`);
        console.log(`  表示されているか: ${info.isVisible ? '⚠️ はい' : '✅ いいえ'}`);
        
        if (info.hasActiveClass || info.isVisible) {
            hasIssue = true;
            console.log('  ⚠️ サイドバーが表示されています！');
            
            // スクリーンショットを撮る
            await page.screenshot({ 
                path: `sidebar-issue-${width}px.png`, 
                fullPage: false 
            });
        }
    }
    
    // CSSルールを確認
    console.log('\n📋 適用されているCSSルール:');
    const cssRules = await page.evaluate(() => {
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText.includes('sidebar-menu') && 
                        rule.cssText.includes('@media')) {
                        rules.push({
                            href: sheet.href?.split('/').pop() || 'inline',
                            rule: rule.cssText.substring(0, 300)
                        });
                    }
                }
            } catch (e) {}
        }
        return rules;
    });
    
    cssRules.forEach(rule => {
        console.log(`\nFrom: ${rule.href}`);
        console.log(`Rule: ${rule.rule}`);
    });
    
    console.log('\n\n📊 結果:');
    if (hasIssue) {
        console.log('⚠️ 481〜768pxの範囲でサイドバーが自動的に表示される問題があります');
    } else {
        console.log('✅ サイドバーは正常に非表示になっています');
    }
    
    await browser.close();
})();