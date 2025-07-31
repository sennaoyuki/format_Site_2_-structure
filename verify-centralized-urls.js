const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: false
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    console.log('🔍 URL一元管理の確認中...');
    
    // 1. clinic-urls.jsの内容を確認
    await page.goto('http://localhost:8090/draft/config/clinic-urls.js');
    const configContent = await page.content();
    console.log('\n📄 clinic-urls.js 読み込み確認: ', configContent.includes('a6640dkh37648h88') ? '✅ 新URL' : '❌ 旧URL');
    
    // 2. メインページの確認
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // CLINIC_URLSグローバル変数の確認
    const clinicUrls = await page.evaluate(() => {
        return window.CLINIC_URLS;
    });
    
    console.log('\n🌐 グローバル変数 CLINIC_URLS:');
    if (clinicUrls && clinicUrls.dio) {
        console.log('DIO URL:', clinicUrls.dio.baseUrl);
        console.log('新URL使用:', clinicUrls.dio.baseUrl.includes('a6640dkh37648h88') ? '✅' : '❌');
    } else {
        console.log('❌ CLINIC_URLSが見つかりません');
    }
    
    // 3. getClinicUrl関数のテスト
    const testUrl = await page.evaluate(() => {
        if (typeof getClinicUrl === 'function') {
            return getClinicUrl('dio');
        }
        return null;
    });
    
    console.log('\n🔧 getClinicUrl("dio")の結果:', testUrl);
    
    // 4. 実際のリンクを確認
    const dioLinks = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('a[href*="/go/dio/"]').forEach(link => {
            links.push({
                text: link.textContent.trim().substring(0, 30),
                href: link.href
            });
        });
        return links;
    });
    
    console.log('\n🔗 DIOへのリンク数:', dioLinks.length);
    
    // 5. リダイレクトページの確認
    console.log('\n🔄 リダイレクトページの確認:');
    
    await page.goto('http://localhost:8090/draft/go/dio/', {
        waitUntil: 'domcontentloaded'
    });
    
    const redirectUrl = await page.evaluate(() => {
        return window.baseUrl || 'URLが見つかりません';
    });
    
    console.log('DIO リダイレクト先:', redirectUrl);
    console.log('新URL使用:', redirectUrl.includes('a6640dkh37648h88') ? '✅' : '❌');
    
    console.log('\n✅ 確認完了');
    await browser.close();
})();