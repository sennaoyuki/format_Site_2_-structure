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
    
    console.log('🔍 550px width debug...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // CSS情報を詳細に調査
    const debugInfo = await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        const rankingContainer = document.querySelector('.ranking-container');
        const firstItem = document.querySelector('.ranking-item');
        
        const getElementInfo = (element, name) => {
            if (!element) return null;
            
            const styles = window.getComputedStyle(element);
            return {
                name,
                offsetWidth: element.offsetWidth,
                scrollWidth: element.scrollWidth,
                clientWidth: element.clientWidth,
                styles: {
                    width: styles.width,
                    maxWidth: styles.maxWidth,
                    minWidth: styles.minWidth,
                    display: styles.display,
                    flexWrap: styles.flexWrap,
                    overflowX: styles.overflowX,
                    boxSizing: styles.boxSizing,
                    padding: styles.padding,
                    gap: styles.gap
                }
            };
        };
        
        return {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            mediaQueries: {
                matches480: window.matchMedia('(max-width: 480px)').matches,
                matches768: window.matchMedia('(max-width: 768px)').matches,
                matches481to768: window.matchMedia('(min-width: 481px) and (max-width: 768px)').matches
            },
            elements: {
                rankingSection: getElementInfo(rankingSection, 'ranking-section'),
                rankingContainer: getElementInfo(rankingContainer, 'ranking-container'),
                firstItem: getElementInfo(firstItem, 'first-ranking-item')
            }
        };
    });
    
    console.log('\n📊 詳細デバッグ情報:');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    console.log('\n⏳ 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();