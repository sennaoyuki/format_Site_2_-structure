const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 本番環境で500pxの表示を確認\n');
    
    // ビューポートを500pxに設定
    await page.setViewportSize({ width: 500, height: 1000 });
    
    // 本番環境のURLにアクセス
    await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // ページの状態を確認
    const pageInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar-menu');
        const overlay = document.querySelector('.sidebar-overlay');
        const body = document.body;
        const main = document.querySelector('main');
        
        // 主要セクションの幅を確認
        const sections = {};
        const sectionNames = [
            '.comparison-section',
            '.clinic-details-section', 
            '.tips-container',
            '.ranking-container',
            '.clinic-rankings'
        ];
        
        sectionNames.forEach(selector => {
            const elem = document.querySelector(selector);
            if (elem) {
                const rect = elem.getBoundingClientRect();
                sections[selector] = {
                    width: rect.width,
                    isOverflowing: rect.width > window.innerWidth
                };
            }
        });
        
        return {
            url: window.location.href,
            viewportWidth: window.innerWidth,
            bodyWidth: body.scrollWidth,
            hasHorizontalScroll: body.scrollWidth > window.innerWidth,
            sidebar: sidebar ? {
                isActive: sidebar.classList.contains('active'),
                right: window.getComputedStyle(sidebar).right,
                isVisible: sidebar.getBoundingClientRect().right > 0
            } : null,
            overlayActive: overlay ? overlay.classList.contains('active') : false,
            sections,
            // CSSファイルの読み込み状況
            stylesheets: Array.from(document.styleSheets).map(sheet => ({
                href: sheet.href,
                loaded: sheet.href ? true : false
            })).filter(s => s.href && s.href.includes('responsive-fix'))
        };
    });
    
    console.log('📱 500pxでの表示状態:');
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  ビューポート幅: ${pageInfo.viewportWidth}px`);
    console.log(`  ボディ幅: ${pageInfo.bodyWidth}px`);
    console.log(`  横スクロール: ${pageInfo.hasHorizontalScroll ? '⚠️ あり' : '✅ なし'}`);
    
    if (pageInfo.sidebar) {
        console.log('\n📋 サイドバーの状態:');
        console.log(`  Active: ${pageInfo.sidebar.isActive ? '⚠️ はい' : '✅ いいえ'}`);
        console.log(`  right: ${pageInfo.sidebar.right}`);
        console.log(`  表示: ${pageInfo.sidebar.isVisible ? '⚠️ されている' : '✅ されていない'}`);
    }
    
    console.log('\n📐 セクションの幅:');
    Object.entries(pageInfo.sections).forEach(([selector, info]) => {
        console.log(`  ${selector}: ${info.width}px ${info.isOverflowing ? '⚠️ オーバーフロー' : '✅'}`);
    });
    
    console.log('\n📄 レスポンシブ修正CSS:');
    if (pageInfo.stylesheets.length > 0) {
        pageInfo.stylesheets.forEach(sheet => {
            console.log(`  ✅ ${sheet.href}`);
        });
    } else {
        console.log('  ⚠️ responsive-fix-480-768.cssが読み込まれていません');
    }
    
    // スクリーンショットを撮る
    await page.screenshot({ 
        path: 'production-500px.png', 
        fullPage: true 
    });
    console.log('\n📸 スクリーンショット: production-500px.png');
    
    // 問題がある場合の診断
    if (pageInfo.hasHorizontalScroll || pageInfo.sidebar?.isVisible) {
        console.log('\n⚠️ 問題が検出されました:');
        if (pageInfo.hasHorizontalScroll) {
            console.log('  - 横スクロールが発生しています');
        }
        if (pageInfo.sidebar?.isVisible) {
            console.log('  - サイドバーが表示されています');
        }
        
        // 追加の診断情報
        const diagnosis = await page.evaluate(() => {
            const rules = [];
            for (const sheet of document.styleSheets) {
                try {
                    if (sheet.href && sheet.href.includes('responsive-fix')) {
                        for (const rule of sheet.cssRules) {
                            if (rule.cssText.includes('@media')) {
                                rules.push(rule.cssText.substring(0, 100) + '...');
                            }
                        }
                    }
                } catch (e) {}
            }
            return rules;
        });
        
        if (diagnosis.length > 0) {
            console.log('\n適用されているメディアクエリ:');
            diagnosis.forEach(rule => console.log(`  ${rule}`));
        }
    }
    
    await browser.close();
})();