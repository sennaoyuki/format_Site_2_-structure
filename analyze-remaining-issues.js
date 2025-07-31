const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 残っている問題の原因を詳細調査\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    // 600pxでテスト
    await page.setViewportSize({ width: 600, height: 1000 });
    await page.waitForTimeout(1000);
    
    // 問題のある要素の親要素を調査
    const analysis = await page.evaluate(() => {
        const results = {};
        
        // 比較表セクションの親要素を遡って調査
        const compSection = document.querySelector('.comparison-section');
        if (compSection) {
            let current = compSection;
            const parents = [];
            
            while (current && current !== document.body) {
                const rect = current.getBoundingClientRect();
                const styles = window.getComputedStyle(current);
                parents.push({
                    tag: current.tagName,
                    class: current.className,
                    width: rect.width,
                    computedWidth: styles.width,
                    maxWidth: styles.maxWidth,
                    padding: styles.padding,
                    margin: styles.margin,
                    boxSizing: styles.boxSizing
                });
                current = current.parentElement;
            }
            
            results.comparisonParents = parents;
        }
        
        // body と main の幅を確認
        const body = document.body;
        const main = document.querySelector('main');
        
        results.body = {
            width: body.offsetWidth,
            scrollWidth: body.scrollWidth,
            computedWidth: window.getComputedStyle(body).width,
            maxWidth: window.getComputedStyle(body).maxWidth,
            padding: window.getComputedStyle(body).padding,
            margin: window.getComputedStyle(body).margin
        };
        
        if (main) {
            results.main = {
                width: main.offsetWidth,
                scrollWidth: main.scrollWidth,
                computedWidth: window.getComputedStyle(main).width,
                maxWidth: window.getComputedStyle(main).maxWidth,
                padding: window.getComputedStyle(main).padding,
                margin: window.getComputedStyle(main).margin
            };
        }
        
        // すべてのセクションの実際の幅を取得
        const sections = [
            '.comparison-section',
            '.clinic-details-section',
            '.tips-container',
            '.ranking-container'
        ];
        
        results.sections = {};
        sections.forEach(selector => {
            const elem = document.querySelector(selector);
            if (elem) {
                const rect = elem.getBoundingClientRect();
                const styles = window.getComputedStyle(elem);
                const parent = elem.parentElement;
                
                results.sections[selector] = {
                    width: rect.width,
                    offsetWidth: elem.offsetWidth,
                    scrollWidth: elem.scrollWidth,
                    computedWidth: styles.width,
                    maxWidth: styles.maxWidth,
                    padding: styles.padding,
                    margin: styles.margin,
                    boxSizing: styles.boxSizing,
                    parentWidth: parent ? parent.offsetWidth : null,
                    parentClass: parent ? parent.className : null
                };
            }
        });
        
        // CSSルールの優先度を確認
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText.includes('comparison-section') || 
                        rule.cssText.includes('max-width: 768px')) {
                        rules.push({
                            href: sheet.href,
                            rule: rule.cssText.substring(0, 200)
                        });
                    }
                }
            } catch (e) {}
        }
        
        results.cssRules = rules;
        
        return results;
    });
    
    console.log('📊 Body と Main の幅:');
    console.log('Body:', JSON.stringify(analysis.body, null, 2));
    if (analysis.main) {
        console.log('Main:', JSON.stringify(analysis.main, null, 2));
    }
    
    console.log('\n📋 比較表セクションの親要素チェーン:');
    if (analysis.comparisonParents) {
        analysis.comparisonParents.forEach((parent, index) => {
            console.log(`${index}. ${parent.tag}.${parent.class}: ${parent.width}px (computed: ${parent.computedWidth}, max: ${parent.maxWidth})`);
        });
    }
    
    console.log('\n🎯 各セクションの詳細:');
    Object.entries(analysis.sections).forEach(([selector, data]) => {
        console.log(`\n${selector}:`);
        console.log(`  実際の幅: ${data.width}px`);
        console.log(`  計算された幅: ${data.computedWidth}`);
        console.log(`  max-width: ${data.maxWidth}`);
        console.log(`  padding: ${data.padding}`);
        console.log(`  親要素: ${data.parentClass} (幅: ${data.parentWidth}px)`);
    });
    
    console.log('\n📝 適用されているCSSルール:');
    analysis.cssRules.forEach(rule => {
        console.log(`From: ${rule.href || 'inline'}`);
        console.log(`Rule: ${rule.rule}...`);
    });
    
    // 問題の原因を特定
    console.log('\n⚠️  問題の原因:');
    console.log('1. body > * セレクタが max-width: 768px を設定している');
    console.log('2. セクションの親要素（おそらくmain）も768pxに制限されている');
    console.log('3. セクション自体の幅が親要素の幅（768px）+ padding（15px × 2）= 798pxになっている');
    
    await browser.close();
})();