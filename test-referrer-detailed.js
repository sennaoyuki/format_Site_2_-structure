const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 region_id=001でのリファラー送信詳細テスト...\n');
    
    // ネットワークリクエストを監視
    const requests = [];
    page.on('request', request => {
        const url = request.url();
        if (url.includes('sss.ac01.l-ad.net') || url.includes('dioclinic.jp')) {
            requests.push({
                url: url,
                method: request.method(),
                headers: request.headers(),
                referrer: request.headers()['referer'] || 'なし'
            });
        }
    });
    
    // Step 1: メインページにアクセス
    console.log('📍 Step 1: メインページにアクセス');
    await page.goto('http://localhost:8090/draft/?region_id=001', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // ディオクリニックのリンクを確認
    const dioLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/draft/go/dio/"]');
        return Array.from(links).map(link => ({
            text: link.textContent.trim(),
            href: link.href,
            outerHTML: link.outerHTML.substring(0, 200)
        }));
    });
    
    console.log(`✅ ディオクリニックのリンク: ${dioLinks.length}件`);
    if (dioLinks.length > 0) {
        console.log(`   最初のリンク: ${dioLinks[0].href}`);
    }
    
    // Step 2: リダイレクトページに直接アクセス
    console.log('\n📍 Step 2: リダイレクトページに直接アクセス');
    await page.goto('http://localhost:8090/draft/go/dio/?region_id=001');
    
    // リダイレクトページの内容を確認
    const redirectInfo = await page.evaluate(() => {
        const metaReferrer = document.querySelector('meta[name="referrer"]');
        const manualLink = document.getElementById('manualLink');
        const scriptContent = Array.from(document.querySelectorAll('script'))
            .filter(s => s.innerHTML.includes('redirectUrl'))
            .map(s => s.innerHTML.substring(0, 500));
        
        return {
            title: document.title,
            referrerPolicy: metaReferrer ? metaReferrer.content : 'なし',
            manualLinkHref: manualLink ? manualLink.href : 'なし',
            hasRedirectScript: scriptContent.length > 0,
            currentUrl: window.location.href
        };
    });
    
    console.log('📊 リダイレクトページ情報:');
    console.log(`   タイトル: ${redirectInfo.title}`);
    console.log(`   リファラーポリシー: ${redirectInfo.referrerPolicy}`);
    console.log(`   現在のURL: ${redirectInfo.currentUrl}`);
    console.log(`   手動リンクのURL: ${redirectInfo.manualLinkHref}`);
    console.log(`   リダイレクトスクリプト: ${redirectInfo.hasRedirectScript ? '有り' : '無し'}`);
    
    // コンソールログを監視
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('リファラー') || text.includes('遷移') || text.includes('リダイレクト')) {
            console.log(`\n🖥️ ページ内ログ: ${text}`);
        }
    });
    
    // Step 3: 実際のリダイレクトを待つ
    console.log('\n📍 Step 3: リダイレクトを待機中...');
    await page.waitForTimeout(6000);
    
    console.log('\n📊 最終結果:');
    console.log(`   現在のURL: ${page.url()}`);
    
    // ネットワークリクエストの結果
    console.log('\n📡 ネットワークリクエスト:');
    requests.forEach((req, index) => {
        console.log(`\n${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Referrer: ${req.referrer}`);
    });
    
    await browser.close();
})();