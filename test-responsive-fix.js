const { chromium } = require('playwright');
const fs = require('fs').promises;

async function checkFixedViewport(page, width) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(1000);
    
    const issues = await page.evaluate(() => {
        const problems = [];
        
        // チェックする主要セクション
        const sections = [
            { selector: '.comparison-section', name: '比較表セクション' },
            { selector: '.clinic-details-section', name: '詳細セクション' },
            { selector: '.tips-container', name: 'Tipsセクション' },
            { selector: '.ranking-container', name: 'ランキングコンテナ' }
        ];
        
        sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);
                
                // 幅の問題をチェック
                if (rect.width > window.innerWidth || element.scrollWidth > element.clientWidth) {
                    problems.push({
                        section: section.name,
                        width: rect.width,
                        scrollWidth: element.scrollWidth,
                        clientWidth: element.clientWidth,
                        viewportWidth: window.innerWidth,
                        overflow: styles.overflow,
                        overflowX: styles.overflowX
                    });
                }
            }
        });
        
        // 横スクロールの有無をチェック
        const hasBodyScroll = document.body.scrollWidth > document.body.clientWidth;
        const hasHtmlScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        
        return {
            problems,
            bodyScroll: hasBodyScroll,
            htmlScroll: hasHtmlScroll,
            bodyWidth: document.body.scrollWidth,
            viewportWidth: window.innerWidth
        };
    });
    
    // スクリーンショットを撮る
    await page.screenshot({ 
        path: `fixed-${width}px.png`, 
        fullPage: true 
    });
    
    return issues;
}

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔧 レスポンシブ修正後のテスト\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    // CSSが適用されているか確認
    const cssLoaded = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => ({
            href: link.href,
            loaded: link.sheet !== null
        }));
    });
    
    console.log('📋 読み込まれたCSS:');
    cssLoaded.forEach(css => {
        console.log(`  ${css.loaded ? '✅' : '❌'} ${css.href}`);
    });
    
    // テストする画面幅
    const viewports = [480, 550, 600, 650, 700, 768];
    const results = {};
    
    for (const width of viewports) {
        console.log(`\n📱 ${width}px でのチェック...`);
        const result = await checkFixedViewport(page, width);
        results[width] = result;
        
        if (result.problems.length === 0) {
            console.log('  ✅ 問題なし');
        } else {
            console.log('  ⚠️  残っている問題:');
            result.problems.forEach(problem => {
                console.log(`    - ${problem.section}: 幅 ${problem.width}px (ビューポート: ${problem.viewportWidth}px)`);
            });
        }
        
        if (result.bodyScroll || result.htmlScroll) {
            console.log(`  ⚠️  横スクロール: Body=${result.bodyScroll}, HTML=${result.htmlScroll}`);
        }
    }
    
    // 修正の効果を確認
    console.log('\n📊 修正効果の確認:');
    console.log('修正前の問題:');
    console.log('  - 比較表セクション: 幅 118828px');
    console.log('  - 詳細セクション: 同様の幅問題');
    console.log('  - Tipsセクション: 748px（ビューポート超過）');
    
    console.log('\n修正後の状態:');
    const allFixed = Object.values(results).every(r => r.problems.length === 0);
    if (allFixed) {
        console.log('  ✅ すべての幅問題が解決されました！');
    } else {
        console.log('  ⚠️  まだ問題が残っています。追加の修正が必要です。');
    }
    
    // 特定セクションの詳細確認
    const detailCheck = await page.evaluate(() => {
        const checks = {};
        
        // 比較表
        const compTable = document.querySelector('.comparison-table');
        if (compTable) {
            checks.comparison = {
                width: compTable.offsetWidth,
                scrollWidth: compTable.scrollWidth,
                parentWidth: compTable.parentElement?.offsetWidth
            };
        }
        
        // Tips
        const tips = document.querySelector('.tips-container');
        if (tips) {
            checks.tips = {
                width: tips.offsetWidth,
                computedWidth: window.getComputedStyle(tips).width,
                maxWidth: window.getComputedStyle(tips).maxWidth
            };
        }
        
        return checks;
    });
    
    console.log('\n🔍 セクション別詳細:');
    console.log(JSON.stringify(detailCheck, null, 2));
    
    await browser.close();
})();