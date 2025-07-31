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
    
    console.log('🔍 Draftディレクトリの完全性を確認中...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000);
    
    // 1. 評価値の確認
    console.log('\n⭐ 評価値の確認:');
    const ratings = await page.evaluate(() => {
        const results = [];
        
        // ランキングセクション
        document.querySelectorAll('.ranking-item').forEach((item, index) => {
            const clinicName = item.querySelector('h3')?.textContent;
            const rating = item.querySelector('.rating-score')?.textContent;
            results.push({ section: 'ランキング', rank: index + 1, clinic: clinicName, rating });
        });
        
        // 比較表
        document.querySelectorAll('.comparison-table tbody tr').forEach((row, index) => {
            const clinicName = row.querySelector('.ranking-table_td1 a')?.textContent;
            const rating = row.querySelector('.ranking_evaluation')?.textContent;
            if (clinicName && rating) {
                results.push({ section: '比較表', rank: index + 1, clinic: clinicName, rating });
            }
        });
        
        return results;
    });
    
    ratings.forEach(r => {
        console.log(`${r.section} - ${r.rank}位: ${r.clinic} = ${r.rating}`);
    });
    
    // 2. ディオクリニックのリンク確認
    console.log('\n🔗 ディオクリニックのリンク確認:');
    const dioLinks = await page.evaluate(() => {
        const links = [];
        
        // 公式サイトボタン
        document.querySelectorAll('a[href*="/go/dio/"]').forEach(link => {
            links.push({
                text: link.textContent.trim(),
                href: link.href,
                location: link.closest('.ranking-item') ? 'ランキング' : 
                         link.closest('.comparison-table') ? '比較表' : 
                         link.closest('.first-choice-recommendation') ? 'おすすめ' : 'その他'
            });
        });
        
        // 表示されているURL
        const displayedUrls = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent.includes('sss.ac01.l-ad.net') || 
            el.textContent.includes('dioclinic.jp')
        ).map(el => ({
            text: el.textContent.substring(0, 100),
            tag: el.tagName
        }));
        
        return { links, displayedUrls };
    });
    
    console.log('リンク数:', dioLinks.links.length);
    dioLinks.links.slice(0, 3).forEach(link => {
        console.log(`- ${link.location}: ${link.href}`);
    });
    
    console.log('\n表示URL:');
    dioLinks.displayedUrls.forEach(url => {
        console.log(`- ${url.tag}: ${url.text}...`);
    });
    
    // 3. エミナルクリニックのリンク確認
    console.log('\n🔗 エミナルクリニックのリンク確認:');
    const eminalLinks = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('a[href*="/go/eminal/"]').forEach(link => {
            links.push({
                text: link.textContent.trim(),
                href: link.href
            });
        });
        return links;
    });
    
    console.log('エミナルリンク数:', eminalLinks.length);
    eminalLinks.slice(0, 2).forEach(link => {
        console.log(`- ${link.href}`);
    });
    
    // 4. リダイレクトページの確認
    console.log('\n🔄 リダイレクトページの確認:');
    
    // ディオのリダイレクトページ
    await page.goto('http://localhost:8090/draft/go/dio/', {
        waitUntil: 'domcontentloaded'
    });
    
    const dioRedirectUrl = await page.evaluate(() => {
        const scriptContent = Array.from(document.querySelectorAll('script')).find(s => 
            s.textContent.includes('baseUrl')
        )?.textContent;
        const match = scriptContent?.match(/baseUrl\s*=\s*['"]([^'"]+)['"]/);
        return match ? match[1] : null;
    });
    
    console.log('ディオ リダイレクト先:', dioRedirectUrl);
    
    // エミナルのリダイレクトページ
    await page.goto('http://localhost:8090/draft/go/eminal/', {
        waitUntil: 'domcontentloaded'
    });
    
    const eminalRedirectUrl = await page.evaluate(() => {
        const scriptContent = Array.from(document.querySelectorAll('script')).find(s => 
            s.textContent.includes('baseUrl')
        )?.textContent;
        const match = scriptContent?.match(/baseUrl\s*=\s*['"]([^'"]+)['"]/);
        return match ? match[1] : null;
    });
    
    console.log('エミナル リダイレクト先:', eminalRedirectUrl);
    
    console.log('\n✅ 確認完了');
    await browser.close();
})();