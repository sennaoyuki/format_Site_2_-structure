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
    
    console.log('🔍 Checking if CSS changes are loaded...');
    
    // Add timestamp to bypass cache
    await page.goto(`http://localhost:8090/draft/?region_id=013&t=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(1000);
    
    // Check if our specific CSS rules are applied
    const cssCheck = await page.evaluate(() => {
        const rankingSection = document.querySelector('.clinic-rankings');
        if (!rankingSection) return null;
        
        const styles = window.getComputedStyle(rankingSection);
        
        // Check for our specific CSS properties
        return {
            isolation: styles.isolation,
            willChange: styles.willChange,
            transform: styles.transform,
            minWidth: styles.minWidth,
            maxWidth: styles.maxWidth,
            width: styles.width,
            offsetWidth: rankingSection.offsetWidth,
            // Check if media query matches
            mediaQuery481to768: window.matchMedia('(min-width: 481px) and (max-width: 768px)').matches
        };
    });
    
    console.log('\n📊 CSS Application Check:');
    console.log(JSON.stringify(cssCheck, null, 2));
    
    // Also check if our CSS file is loaded properly
    const stylesheets = await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets);
        return sheets.map(sheet => {
            try {
                return {
                    href: sheet.href,
                    rules: sheet.cssRules ? sheet.cssRules.length : 'blocked'
                };
            } catch (e) {
                return {
                    href: sheet.href,
                    error: e.message
                };
            }
        });
    });
    
    console.log('\n📄 Loaded Stylesheets:');
    console.log(JSON.stringify(stylesheets, null, 2));
    
    await page.waitForTimeout(3000);
    await browser.close();
})();