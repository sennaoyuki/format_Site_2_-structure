const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const page = await browser.newPage();
  
  // コンソールログを表示
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  try {
    const url = 'http://localhost:8889/';
    console.log('Opening:', url);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // app.jsが読み込まれているか確認
    const hasApp = await page.evaluate(() => {
      return typeof window.app !== 'undefined';
    });
    console.log('App loaded:', hasApp);
    
    // モーダル要素の存在確認
    const modalExists = await page.evaluate(() => {
      const modal = document.getElementById('map-modal');
      return modal !== null;
    });
    console.log('Modal element exists:', modalExists);
    
    // 地図ボタンを探してクリック
    const mapButton = await page.$('.map-toggle-btn');
    if (mapButton) {
      console.log('Clicking map button...');
      
      // クリック前のモーダル状態
      const beforeClick = await page.evaluate(() => {
        const modal = document.getElementById('map-modal');
        return modal ? modal.style.display : 'no modal';
      });
      console.log('Modal display before click:', beforeClick);
      
      await mapButton.click();
      await page.waitForTimeout(2000);
      
      // クリック後のモーダル状態
      const afterClick = await page.evaluate(() => {
        const modal = document.getElementById('map-modal');
        return modal ? modal.style.display : 'no modal';
      });
      console.log('Modal display after click:', afterClick);
      
      // モーダルが表示されているかチェック
      const isVisible = await page.evaluate(() => {
        const modal = document.getElementById('map-modal');
        return modal && modal.style.display === 'flex';
      });
      
      if (isVisible) {
        console.log('✓ Modal is now visible!');
        
        // モーダルの内容を取得
        const modalContent = await page.evaluate(() => {
          return {
            clinicName: document.getElementById('map-modal-clinic-name')?.textContent,
            address: document.getElementById('map-modal-address')?.textContent,
            access: document.getElementById('map-modal-access')?.textContent,
            hours: document.getElementById('map-modal-hours')?.textContent
          };
        });
        console.log('Modal content:', modalContent);
        
        // スクリーンショットを撮る
        await page.screenshot({ 
          path: 'map-modal-success.png',
          fullPage: false 
        });
        console.log('Screenshot saved as map-modal-success.png');
      } else {
        console.log('✗ Modal is still not visible');
        
        // デバッグ情報を収集
        const debugInfo = await page.evaluate(() => {
          const modal = document.getElementById('map-modal');
          const buttons = document.querySelectorAll('.map-toggle-btn');
          return {
            modalExists: modal !== null,
            modalDisplay: modal?.style.display,
            modalClassName: modal?.className,
            buttonCount: buttons.length,
            firstButtonHTML: buttons[0]?.outerHTML
          };
        });
        console.log('Debug info:', debugInfo);
      }
    } else {
      console.log('No map button found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(5000); // ブラウザを開いたままにする
    await browser.close();
  }
})();