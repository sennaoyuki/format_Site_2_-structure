const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 550, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 Finding source of width calculation...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(1000);
    
    // Inspect all inline styles and computed styles
    const widthSource = await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        const rankingContainer = document.querySelector('.ranking-container');
        
        const getFullStyles = (element, name) => {
            if (!element) return null;
            
            const styles = window.getComputedStyle(element);
            const inlineStyle = element.getAttribute('style');
            
            return {
                name,
                inlineStyle,
                classList: Array.from(element.classList),
                offsetWidth: element.offsetWidth,
                computedStyles: {
                    width: styles.width,
                    minWidth: styles.minWidth,
                    maxWidth: styles.maxWidth,
                    flex: styles.flex,
                    flexBasis: styles.flexBasis,
                    flexGrow: styles.flexGrow,
                    flexShrink: styles.flexShrink
                }
            };
        };
        
        // Also check all parent elements for width influence
        const parents = [];
        let current = rankingSection;
        while (current && current !== document.body) {
            parents.push({
                tagName: current.tagName,
                className: current.className,
                offsetWidth: current.offsetWidth,
                computedWidth: window.getComputedStyle(current).width,
                inlineStyle: current.getAttribute('style')
            });
            current = current.parentElement;
        }
        
        return {
            rankingSection: getFullStyles(rankingSection, 'ranking-section'),
            rankingContainer: getFullStyles(rankingContainer, 'ranking-container'),
            parents: parents
        };
    });
    
    console.log('\n📊 Full width analysis:');
    console.log(JSON.stringify(widthSource, null, 2));
    
    await page.waitForTimeout(3000);
    await browser.close();
})();