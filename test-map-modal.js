const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // HTTPサーバー経由で開く
    const url = 'http://localhost:8889/';
    console.log('Opening:', url);
    
    await page.goto(url);
    await page.waitForTimeout(2000);
    
    // ページが正しく読み込まれたか確認
    const title = await page.title();
    console.log('Page title:', title);
    
    // 店舗一覧セクションまでスクロール
    const storesSection = await page.$('.stores-section, .brand-section, [id*="stores"]');
    if (storesSection) {
      await storesSection.scrollIntoViewIfNeeded();
      console.log('Scrolled to stores section');
    }
    
    // 地図ボタンを探す
    const mapButtons = await page.$$('.map-toggle-btn');
    console.log('Found map buttons:', mapButtons.length);
    
    if (mapButtons.length > 0) {
      // 最初の地図ボタンをクリック
      console.log('Clicking first map button...');
      await mapButtons[0].click();
      await page.waitForTimeout(1000);
      
      // モーダルが表示されたか確認
      const modal = await page.$('#map-modal');
      const isVisible = modal && await modal.isVisible();
      
      if (isVisible) {
        console.log('✓ Modal is visible!');
        
        // スクリーンショットを撮る
        await page.screenshot({ 
          path: 'map-modal-screenshot.png',
          fullPage: false 
        });
        console.log('Screenshot saved as map-modal-screenshot.png');
        
        // モーダルの内容を確認
        const clinicName = await page.textContent('#map-modal-clinic-name');
        const address = await page.textContent('#map-modal-address');
        console.log('Clinic:', clinicName);
        console.log('Address:', address);
      } else {
        console.log('✗ Modal is not visible');
        
        // デバッグ用：ページ全体のスクリーンショット
        await page.screenshot({ 
          path: 'page-screenshot.png',
          fullPage: true 
        });
        console.log('Page screenshot saved for debugging');
      }
    } else {
      console.log('No map buttons found on the page');
      
      // デバッグ用：ページのHTMLを確認
      const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
      console.log('Page HTML preview:', bodyHTML);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();