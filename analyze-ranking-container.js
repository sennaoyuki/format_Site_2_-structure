const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 ランキングコンテナの問題を詳細調査\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    await page.setViewportSize({ width: 600, height: 1000 });
    await page.waitForTimeout(1000);
    
    const analysis = await page.evaluate(() => {
        const container = document.querySelector('.ranking-container');
        const rankings = document.querySelector('.clinic-rankings');
        
        const result = {};
        
        if (container) {
            const rect = container.getBoundingClientRect();
            const styles = window.getComputedStyle(container);
            const parent = container.parentElement;
            
            result.container = {
                width: rect.width,
                offsetWidth: container.offsetWidth,
                scrollWidth: container.scrollWidth,
                clientWidth: container.clientWidth,
                computedWidth: styles.width,
                computedMaxWidth: styles.maxWidth,
                padding: styles.padding,
                margin: styles.margin,
                boxSizing: styles.boxSizing,
                overflow: styles.overflow,
                overflowX: styles.overflowX
            };
            
            if (parent) {
                const parentRect = parent.getBoundingClientRect();
                const parentStyles = window.getComputedStyle(parent);
                result.parent = {
                    class: parent.className,
                    width: parentRect.width,
                    offsetWidth: parent.offsetWidth,
                    computedWidth: parentStyles.width,
                    padding: parentStyles.padding,
                    margin: parentStyles.margin
                };
            }
        }
        
        if (rankings) {
            const rect = rankings.getBoundingClientRect();
            const styles = window.getComputedStyle(rankings);
            result.rankings = {
                width: rect.width,
                offsetWidth: rankings.offsetWidth,
                computedWidth: styles.width,
                padding: styles.padding,
                margin: styles.margin
            };
        }
        
        // CSSルールを確認
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText.includes('.ranking-container') && 
                        rule.cssText.includes('width')) {
                        rules.push({
                            href: sheet.href?.split('/').pop() || 'inline',
                            rule: rule.cssText.substring(0, 300)
                        });
                    }
                }
            } catch (e) {}
        }
        result.cssRules = rules;
        
        // ランキングアイテムのサイズも確認
        const items = document.querySelectorAll('.ranking-item');
        if (items.length > 0) {
            const firstItem = items[0];
            const itemRect = firstItem.getBoundingClientRect();
            const itemStyles = window.getComputedStyle(firstItem);
            result.rankingItem = {
                width: itemRect.width,
                computedWidth: itemStyles.width,
                margin: itemStyles.margin,
                count: items.length
            };
        }
        
        return result;
    });
    
    console.log('📊 ランキングコンテナの分析結果:');
    console.log('\nコンテナ自体:');
    console.log(JSON.stringify(analysis.container, null, 2));
    
    console.log('\n親要素（clinic-rankings）:');
    console.log(JSON.stringify(analysis.parent, null, 2));
    
    console.log('\nrankingsセクション:');
    console.log(JSON.stringify(analysis.rankings, null, 2));
    
    console.log('\nランキングアイテム:');
    console.log(JSON.stringify(analysis.rankingItem, null, 2));
    
    console.log('\n適用されているCSSルール:');
    analysis.cssRules.forEach(rule => {
        console.log(`\nFrom: ${rule.href}`);
        console.log(`Rule: ${rule.rule}`);
    });
    
    console.log('\n⚠️  問題の原因:');
    console.log('1. ranking-containerの幅が固定値（500px）に設定されている可能性');
    console.log('2. calc(100% - 30px)の計算が正しく適用されていない');
    console.log('3. 親要素のpaddingとの組み合わせで問題が発生');
    
    await browser.close();
})();