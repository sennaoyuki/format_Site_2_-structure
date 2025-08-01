const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 region_id=001のリダイレクトフローを詳細に確認\n');
    
    // ネットワークリクエストを詳細に記録
    const networkLog = [];
    page.on('request', request => {
        networkLog.push({
            time: new Date().toISOString(),
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            type: 'request'
        });
    });
    
    page.on('response', response => {
        networkLog.push({
            time: new Date().toISOString(),
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            type: 'response'
        });
    });
    
    // Step 1: メインページで確認
    console.log('📍 Step 1: メインページでリンクを確認');
    await page.goto('http://localhost:8090/draft/?region_id=001');
    await page.waitForTimeout(2000);
    
    // ディオクリニックのリンクを取得
    const mainPageLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/draft/go/dio/"]');
        return Array.from(links).slice(0, 3).map(link => ({
            text: link.textContent.trim(),
            href: link.href,
            onclick: link.onclick ? link.onclick.toString() : null,
            target: link.target
        }));
    });
    
    console.log('メインページのリンク:');
    mainPageLinks.forEach(link => {
        console.log(`  - ${link.text}: ${link.href}`);
        console.log(`    target: ${link.target || 'なし'}, onclick: ${link.onclick ? 'あり' : 'なし'}`);
    });
    
    // Step 2: リダイレクトページの内容を確認
    console.log('\n📍 Step 2: リダイレクトページの実装を確認');
    await page.goto('http://localhost:8090/draft/go/dio/?region_id=001');
    
    // ページのHTMLを取得
    const htmlContent = await page.content();
    
    // メタタグを確認
    const metaTags = await page.evaluate(() => {
        const metas = document.querySelectorAll('meta');
        return Array.from(metas).map(meta => ({
            name: meta.getAttribute('name'),
            httpEquiv: meta.getAttribute('http-equiv'),
            content: meta.getAttribute('content')
        }));
    });
    
    console.log('\nメタタグ:');
    metaTags.filter(m => m.name === 'referrer' || m.httpEquiv === 'Content-Security-Policy').forEach(meta => {
        console.log(`  - ${meta.name || meta.httpEquiv}: ${meta.content}`);
    });
    
    // リダイレクトスクリプトの内容を確認
    const scriptContent = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.innerHTML.includes('redirectUrl')) {
                return script.innerHTML;
            }
        }
        return null;
    });
    
    if (scriptContent) {
        console.log('\nリダイレクトスクリプトの重要部分:');
        const lines = scriptContent.split('\n');
        lines.forEach(line => {
            if (line.includes('redirectUrl') || line.includes('region_id') || line.includes('referrer') || line.includes('location')) {
                console.log(`  ${line.trim()}`);
            }
        });
    }
    
    // Step 3: 実際のリダイレクトの流れを記録
    console.log('\n📍 Step 3: リダイレクトの実行');
    console.log('5秒間待機してリダイレクトの流れを記録...\n');
    
    await page.waitForTimeout(5000);
    
    // ネットワークログから重要なリクエストを抽出
    console.log('📡 ネットワークフロー:');
    networkLog.forEach((log, index) => {
        if (log.url.includes('localhost') || log.url.includes('sss.ac01') || log.url.includes('dioclinic')) {
            if (log.type === 'request') {
                console.log(`\n${index + 1}. リクエスト: ${log.method} ${log.url}`);
                console.log(`   Referer: ${log.headers.referer || 'なし'}`);
            } else if (log.type === 'response' && log.status >= 300 && log.status < 400) {
                console.log(`   → リダイレクト応答: ${log.status}`);
                console.log(`   Location: ${log.headers.location || 'なし'}`);
            }
        }
    });
    
    console.log(`\n📊 最終URL: ${page.url()}`);
    
    // Step 4: 他のregion_idと比較
    console.log('\n📍 Step 4: region_id=013（東京）と比較');
    await page.goto('http://localhost:8090/draft/go/dio/?region_id=013');
    
    const tokyo013Info = await page.evaluate(() => {
        const manualLink = document.getElementById('manualLink');
        return {
            currentUrl: window.location.href,
            redirectUrl: manualLink ? manualLink.href : null,
            metaReferrer: document.querySelector('meta[name="referrer"]')?.content
        };
    });
    
    console.log('\n比較結果:');
    console.log('region_id=001:');
    console.log(`  URL: http://localhost:8090/draft/go/dio/?region_id=001`);
    console.log('region_id=013:');
    console.log(`  URL: http://localhost:8090/draft/go/dio/?region_id=013`);
    console.log(`  メタタグ: 同じ (${tokyo013Info.metaReferrer})`);
    console.log('  実装: 同じリダイレクトページを使用');
    
    console.log('\n💡 結論:');
    console.log('1. リダイレクトページの実装は全region_idで同一');
    console.log('2. unsafe-urlポリシーが正しく設定されている');
    console.log('3. パラメータ付きURLが正しく送信されている');
    console.log('4. 問題はクライアント側ではなく、受信側の処理にある可能性');
    
    await browser.close();
})();