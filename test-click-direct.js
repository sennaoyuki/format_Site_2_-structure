const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('showMapModal') || msg.text().includes('setupMap')) {
      console.log('Console:', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:8889/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // setupMapAccordionsが呼ばれたか確認
    const setupCalled = await page.evaluate(() => {
      // setupMapAccordionsを直接呼び出してみる
      if (window.app && typeof window.app.setupMapAccordions === 'function') {
        console.log('Calling setupMapAccordions manually...');
        window.app.setupMapAccordions();
        return true;
      }
      return false;
    });
    console.log('setupMapAccordions manually called:', setupCalled);
    
    await page.waitForTimeout(1000);
    
    // 地図ボタンをクリック
    const mapButton = await page.$('.map-toggle-btn');
    if (mapButton) {
      console.log('Clicking map button...');
      await mapButton.click();
      await page.waitForTimeout(2000);
      
      // モーダルの状態を確認
      const modalState = await page.evaluate(() => {
        const modal = document.getElementById('map-modal');
        return {
          exists: modal !== null,
          display: modal?.style.display,
          visible: modal && modal.style.display === 'flex'
        };
      });
      
      if (modalState.visible) {
        console.log('✓ SUCCESS! Modal is visible');
        
        // スクリーンショットを撮る
        await page.screenshot({ 
          path: 'map-modal-working.png',
          fullPage: false 
        });
        console.log('Screenshot saved!');
        
        // モーダルの内容も確認
        const content = await page.evaluate(() => {
          return {
            title: document.getElementById('map-modal-clinic-name')?.textContent,
            address: document.getElementById('map-modal-address')?.textContent
          };
        });
        console.log('Modal shows:', content);
      } else {
        console.log('Modal state:', modalState);
        
        // イベントリスナーが設定されているか確認
        const hasListener = await page.evaluate(() => {
          const button = document.querySelector('.map-toggle-btn');
          // クリックイベントをシミュレート
          if (button) {
            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            button.dispatchEvent(event);
            return true;
          }
          return false;
        });
        console.log('Event dispatched:', hasListener);
        
        await page.waitForTimeout(1000);
        
        // 再度確認
        const finalCheck = await page.evaluate(() => {
          const modal = document.getElementById('map-modal');
          return modal && modal.style.display === 'flex';
        });
        
        if (finalCheck) {
          console.log('✓ Modal appeared after event dispatch!');
          await page.screenshot({ 
            path: 'map-modal-final.png',
            fullPage: false 
          });
        }
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();