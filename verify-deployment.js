const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Checking deployment status...');
    await page.goto('https://format-site-2-structure.vercel.app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check if the new tab structure exists
    const tabsExist = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tabheader li');
      return tabs.length;
    });

    console.log(`Number of tabs found: ${tabsExist}`);

    if (tabsExist === 3) {
      console.log('✅ Deployment successful! New 3-tab structure is live.');
      
      // Get tab names
      const tabNames = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.tabheader li')).map(tab => tab.textContent.trim());
      });
      console.log('Tab names:', tabNames);
    } else {
      console.log('❌ Deployment not updated yet. Still showing old structure.');
    }

    await page.screenshot({ path: 'deployment-check.png' });
    console.log('Screenshot saved as deployment-check.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();