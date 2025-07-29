const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Browser:', msg.text()));
  
  try {
    await page.goto('http://localhost:8889/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 店舗要素の構造を確認
    const storeStructure = await page.evaluate(() => {
      const button = document.querySelector('.map-toggle-btn');
      if (!button) return 'No button found';
      
      // 親要素を遡って確認
      let current = button;
      const structure = [];
      for (let i = 0; i < 10 && current; i++) {
        structure.push({
          tag: current.tagName,
          class: current.className,
          id: current.id
        });
        current = current.parentElement;
      }
      
      // 店舗情報を探す
      const parent = button.parentElement;
      const storeInfo = {
        shopInfo: parent?.querySelector('.shop-info')?.innerHTML,
        shopName: parent?.querySelector('.shop-name')?.textContent,
        shopAddress: parent?.querySelector('.shop-address')?.textContent
      };
      
      return { structure, storeInfo };
    });
    
    console.log('Store structure:', JSON.stringify(storeStructure, null, 2));
    
    // セレクタを修正してテスト
    const clickResult = await page.evaluate(() => {
      const button = document.querySelector('.map-toggle-btn');
      if (!button) return 'No button';
      
      // 正しい親要素を見つける
      const storeItem = button.closest('.store-col') || button.parentElement;
      
      // 店舗情報を取得
      const shopName = storeItem?.querySelector('.shop-name')?.textContent?.trim();
      const shopAddress = storeItem?.querySelector('.shop-address')?.textContent?.trim();
      
      // showMapModalを直接呼び出す
      if (window.app && window.app.showMapModal) {
        window.app.showMapModal(
          shopName || 'テストクリニック',
          shopAddress || 'テスト住所',
          'テストアクセス',
          'dio'
        );
        return 'Called showMapModal';
      }
      
      return 'No app.showMapModal';
    });
    
    console.log('Click result:', clickResult);
    await page.waitForTimeout(2000);
    
    // モーダルの状態を確認
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('map-modal');
      return modal && modal.style.display === 'flex';
    });
    
    if (modalVisible) {
      console.log('✓ SUCCESS! Modal is now visible!');
      await page.screenshot({ path: 'map-modal-success.png' });
      console.log('Screenshot saved as map-modal-success.png');
    } else {
      console.log('Modal still not visible');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();