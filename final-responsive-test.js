const { chromium } = require('playwright');
const fs = require('fs').promises;

async function finalCheck(page, width) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(1000);
    
    const issues = await page.evaluate(() => {
        const problems = [];
        
        // 主要セクションをチェック
        const sections = [
            { selector: '.comparison-section', name: '比較表セクション' },
            { selector: '.clinic-details-section', name: '詳細セクション' },
            { selector: '.tips-container', name: 'Tipsセクション' },
            { selector: '.ranking-container', name: 'ランキングコンテナ' },
            { selector: '.clinic-rankings', name: 'ランキングセクション' }
        ];
        
        sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const rect = element.getBoundingClientRect();
                
                // ビューポートを超えているかチェック
                if (rect.width > window.innerWidth) {
                    problems.push({
                        section: section.name,
                        width: rect.width,
                        viewportWidth: window.innerWidth,
                        exceedsBy: rect.width - window.innerWidth
                    });
                }
            }
        });
        
        // body全体の横スクロールをチェック
        const hasScroll = document.body.scrollWidth > window.innerWidth;
        
        return {
            problems,
            hasBodyScroll: hasScroll,
            bodyWidth: document.body.scrollWidth,
            viewportWidth: window.innerWidth
        };
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
    
    console.log('🎯 最終的なレスポンシブ動作確認\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    const viewports = [480, 550, 600, 650, 700, 768];
    let allFixed = true;
    
    for (const width of viewports) {
        console.log(`\n📱 ${width}px での確認:`);
        const result = await finalCheck(page, width);
        
        if (result.problems.length === 0 && !result.hasBodyScroll) {
            console.log('  ✅ 完璧！問題なし');
        } else {
            allFixed = false;
            if (result.problems.length > 0) {
                console.log('  ⚠️  幅の問題:');
                result.problems.forEach(p => {
                    console.log(`    - ${p.section}: ${p.width}px (${p.exceedsBy}px超過)`);
                });
            }
            if (result.hasBodyScroll) {
                console.log(`  ⚠️  横スクロール発生: body幅 ${result.bodyWidth}px`);
            }
        }
        
        // スクリーンショットを撮る
        await page.screenshot({ 
            path: `final-${width}px.png`, 
            fullPage: true 
        });
    }
    
    console.log('\n\n📊 最終結果:');
    if (allFixed) {
        console.log('✅ すべての問題が解決されました！');
        console.log('480〜768pxのすべての幅で正常に表示されています。');
    } else {
        console.log('⚠️  まだ一部の問題が残っています。');
    }
    
    // 特定要素の詳細確認（デバッグ用）
    await page.setViewportSize({ width: 600, height: 1000 });
    const debug = await page.evaluate(() => {
        const elements = {
            main: document.querySelector('main'),
            container: document.querySelector('.container'),
            rankings: document.querySelector('.clinic-rankings'),
            rankingContainer: document.querySelector('.ranking-container')
        };
        
        const info = {};
        Object.entries(elements).forEach(([name, el]) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                info[name] = {
                    width: rect.width,
                    computedWidth: styles.width,
                    padding: styles.padding,
                    margin: styles.margin
                };
            }
        });
        
        return info;
    });
    
    console.log('\n🔍 要素の詳細情報（600px時）:');
    console.log(JSON.stringify(debug, null, 2));
    
    await browser.close();
})();