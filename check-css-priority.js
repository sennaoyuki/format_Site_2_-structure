const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 CSSの優先度問題を確認\n');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/', {
        waitUntil: 'networkidle'
    });
    
    // CASEセクションまでスクロール
    await page.evaluate(() => {
        const caseSection = document.querySelector('.case-slider');
        if (caseSection) {
            caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(2000);
    
    // 画像に適用されているすべてのスタイルを取得
    const imageStyles = await page.evaluate(() => {
        const img = document.querySelector('.case-slider .slick-slide.slick-current img');
        if (!img) return null;
        
        // 計算されたスタイル
        const computed = window.getComputedStyle(img);
        
        // インラインスタイル
        const inline = img.getAttribute('style');
        
        // 適用されているCSSルールを取得
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.type === CSSRule.STYLE_RULE) {
                        // セレクタがマッチするか確認
                        if (img.matches(rule.selectorText)) {
                            rules.push({
                                selector: rule.selectorText,
                                styles: rule.style.cssText,
                                source: sheet.href || 'inline'
                            });
                        }
                    }
                }
            } catch (e) {}
        }
        
        // 特定のプロパティの値の由来を確認
        const propertySource = (prop) => {
            for (const rule of rules) {
                if (rule.styles.includes(prop)) {
                    return rule;
                }
            }
            return null;
        };
        
        return {
            computed: {
                width: computed.width,
                maxWidth: computed.maxWidth,
                height: computed.height,
                maxHeight: computed.maxHeight,
                padding: computed.padding
            },
            inline,
            widthSource: propertySource('width'),
            maxWidthSource: propertySource('max-width'),
            allRules: rules
        };
    });
    
    console.log('📋 画像のスタイル情報:');
    console.log('\n計算されたスタイル:');
    Object.entries(imageStyles.computed).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    if (imageStyles.inline) {
        console.log(`\nインラインスタイル: ${imageStyles.inline}`);
    }
    
    console.log('\n適用されているCSSルール:');
    imageStyles.allRules.forEach((rule, index) => {
        console.log(`\n${index + 1}. ${rule.selector}`);
        console.log(`   ソース: ${rule.source}`);
        console.log(`   スタイル: ${rule.styles.substring(0, 150)}...`);
    });
    
    // 実際に375px以下のルールが適用されているか確認
    const mediaQueryTest = await page.evaluate(() => {
        const queries = [
            { query: '(max-width: 375px)', name: '375px以下' },
            { query: '(max-width: 768px)', name: '768px以下' },
            { query: '(min-width: 481px) and (max-width: 768px)', name: '481-768px' }
        ];
        
        return queries.map(mq => ({
            ...mq,
            matches: window.matchMedia(mq.query).matches
        }));
    });
    
    console.log('\n📱 メディアクエリの状態:');
    mediaQueryTest.forEach(mq => {
        console.log(`  ${mq.name}: ${mq.matches ? '✅ 適用中' : '❌ 非適用'}`);
    });
    
    await browser.close();
})();