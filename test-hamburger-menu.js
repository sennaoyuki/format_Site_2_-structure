const { chromium } = require('playwright');

async function testHamburgerMenu() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    try {
        // コンソールメッセージを監視
        page.on('console', msg => {
            console.log(`[ブラウザコンソール ${msg.type()}]:`, msg.text());
        });
        
        console.log('📍 ステップ1: ページを開く...');
        await page.goto('http://localhost:8001/index.html');
        await page.waitForTimeout(3000);
        
        // ハンバーガーメニューの存在確認
        console.log('📍 ステップ2: ハンバーガーメニューの確認...');
        const hamburgerExists = await page.locator('#hamburger-menu').count() > 0;
        console.log(`   ハンバーガーメニュー: ${hamburgerExists ? '✅ 存在' : '❌ 存在しない'}`);
        
        if (hamburgerExists) {
            // ハンバーガーメニューの位置情報を取得
            const hamburgerBox = await page.locator('#hamburger-menu').boundingBox();
            console.log('   位置情報:', hamburgerBox);
            
            // 可視性の確認
            const isVisible = await page.locator('#hamburger-menu').isVisible();
            console.log(`   表示状態: ${isVisible ? '✅ 表示されている' : '❌ 非表示'}`);
            
            // サイドバーの初期状態確認
            console.log('\n📍 ステップ3: サイドバーの初期状態...');
            const sidebarHasActive = await page.locator('#sidebar-menu').evaluate(el => el.classList.contains('active'));
            console.log(`   サイドバーactive: ${sidebarHasActive ? 'あり' : 'なし'}`);
            
            // ハンバーガーメニューをクリック
            console.log('\n📍 ステップ4: ハンバーガーメニューをクリック...');
            await page.click('#hamburger-menu');
            await page.waitForTimeout(1000);
            
            // クリック後の状態確認
            console.log('📍 ステップ5: クリック後の状態確認...');
            const hamburgerActive = await page.locator('#hamburger-menu').evaluate(el => el.classList.contains('active'));
            const sidebarActive = await page.locator('#sidebar-menu').evaluate(el => el.classList.contains('active'));
            const overlayActive = await page.locator('#sidebar-overlay').evaluate(el => el.classList.contains('active'));
            
            console.log(`   ハンバーガーメニューactive: ${hamburgerActive ? '✅ あり' : '❌ なし'}`);
            console.log(`   サイドバーactive: ${sidebarActive ? '✅ あり' : '❌ なし'}`);
            console.log(`   オーバーレイactive: ${overlayActive ? '✅ あり' : '❌ なし'}`);
            
            // サイドバーの表示位置確認
            const sidebarStyle = await page.locator('#sidebar-menu').evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    right: computed.right,
                    display: computed.display,
                    visibility: computed.visibility
                };
            });
            console.log('   サイドバーのスタイル:', sidebarStyle);
            
            // 検索フィールドの確認
            console.log('\n📍 ステップ6: 検索フィールドの確認...');
            const searchFieldVisible = await page.locator('#sidebar-clinic-search').isVisible();
            console.log(`   検索フィールド: ${searchFieldVisible ? '✅ 表示' : '❌ 非表示'}`);
            
            // もう一度クリックして閉じる
            console.log('\n📍 ステップ7: もう一度クリックして閉じる...');
            await page.click('#hamburger-menu');
            await page.waitForTimeout(1000);
            
            const sidebarClosedActive = await page.locator('#sidebar-menu').evaluate(el => el.classList.contains('active'));
            console.log(`   サイドバーactive: ${sidebarClosedActive ? '❌ まだ開いている' : '✅ 閉じた'}`);
        }
        
        console.log('\n✅ テスト完了！');
        
    } catch (error) {
        console.error('❌ エラー発生:', error);
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

testHamburgerMenu();