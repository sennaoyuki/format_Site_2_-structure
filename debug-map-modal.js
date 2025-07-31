const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 地図モーダルのリンク設定をデバッグ...');
    
    // コンソールログを監視
    page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('Map') || msg.text().includes('map')) {
            console.log('📝 地図関連ログ:', msg.text());
        }
    });
    
    // メインページをロード
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('✅ メインページロード完了');
    
    // 地図ボタンを探す
    const mapButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, .map-btn, [onclick*="showMapModal"], [onclick*="map"]'));
        return buttons.map(btn => ({
            text: btn.textContent?.trim(),
            onclick: btn.getAttribute('onclick'),
            className: btn.className,
            id: btn.id
        })).filter(btn => btn.text?.includes('地図') || btn.onclick?.includes('map'));
    });
    
    console.log('🗺️ 見つかった地図ボタン:', mapButtons);
    
    if (mapButtons.length > 0) {
        // 最初の地図ボタンをクリック
        console.log('🔗 地図ボタンをクリック...');
        
        await page.click('button:has-text("地図"), .map-btn, [onclick*="showMapModal"]:first-of-type');
        await page.waitForTimeout(1000);
        
        // モーダルの状態を確認
        const modalInfo = await page.evaluate(() => {
            const modal = document.getElementById('map-modal');
            const button = document.getElementById('map-modal-button');
            const buttonText = document.getElementById('map-modal-button-text');
            
            return {
                modalExists: !!modal,
                modalVisible: modal ? modal.style.display !== 'none' : false,
                buttonExists: !!button,
                buttonHref: button ? button.href : null,
                buttonText: buttonText ? buttonText.textContent : null,
                modalHTML: modal ? modal.innerHTML.substring(0, 500) : null
            };
        });
        
        console.log('📋 モーダル情報:');
        console.log('- モーダル存在:', modalInfo.modalExists);
        console.log('- モーダル表示:', modalInfo.modalVisible);
        console.log('- ボタン存在:', modalInfo.buttonExists);
        console.log('- ボタンhref:', modalInfo.buttonHref);
        console.log('- ボタンテキスト:', modalInfo.buttonText);
        
        if (modalInfo.buttonHref?.includes('#')) {
            console.log('❌ 問題発見: ボタンのhrefが "#" のままです');
        }
        
    } else {
        console.log('❌ 地図ボタンが見つかりません');
    }
    
    console.log('\n✅ デバッグ完了');
    await new Promise(() => {}); // Keep open
})();