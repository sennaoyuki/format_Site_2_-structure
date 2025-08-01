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
    
    console.log('🔍 詳細セクションの問題を調査中...');
    
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // 詳細セクションの状態を詳しく調査
    const detailsInfo = await page.evaluate(() => {
        const detailsSection = document.querySelector('.clinic-details-section');
        const detailsList = document.querySelector('#clinic-details-list');
        const tipsSection = document.querySelector('.tips-section');
        
        const result = {
            detailsSection: {
                exists: !!detailsSection,
                html: detailsSection ? detailsSection.innerHTML.substring(0, 200) : null,
                style: detailsSection ? {
                    display: window.getComputedStyle(detailsSection).display,
                    visibility: window.getComputedStyle(detailsSection).visibility,
                    height: detailsSection.offsetHeight
                } : null
            },
            detailsList: {
                exists: !!detailsList,
                childrenCount: detailsList ? detailsList.children.length : 0,
                html: detailsList ? detailsList.innerHTML.substring(0, 200) : null
            },
            tipsSection: {
                exists: !!tipsSection,
                html: tipsSection ? tipsSection.innerHTML.substring(0, 200) : null
            }
        };
        
        // JavaScriptで生成されるはずの要素を確認
        const clinicDetailsElements = document.querySelectorAll('.clinic-detail-wrapper');
        result.generatedDetails = {
            count: clinicDetailsElements.length,
            ids: Array.from(clinicDetailsElements).map(el => el.id)
        };
        
        return result;
    });
    
    console.log('\n📊 詳細セクション分析:');
    console.log(JSON.stringify(detailsInfo, null, 2));
    
    // app.jsの実行状態を確認
    const appStatus = await page.evaluate(() => {
        return {
            appExists: typeof window.app !== 'undefined',
            dataManagerExists: typeof window.dataManager !== 'undefined',
            clinicsLoaded: window.dataManager ? window.dataManager.clinics.length : 0
        };
    });
    
    console.log('\n🔧 App状態:');
    console.log(JSON.stringify(appStatus, null, 2));
    
    // 詳細セクションを手動で生成してみる
    console.log('\n🔨 詳細セクションの生成を試行...');
    const generationResult = await page.evaluate(() => {
        if (window.app && window.app.displayManager) {
            try {
                const clinics = window.dataManager.getClinicsByRegion('013');
                window.app.displayManager.renderClinicsSection(clinics.slice(0, 5));
                return { success: true, clinicsCount: clinics.length };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'App or DisplayManager not found' };
    });
    
    console.log('生成結果:', generationResult);
    
    // 再度確認
    await page.waitForTimeout(1000);
    const afterGeneration = await page.evaluate(() => {
        const detailsList = document.querySelector('#clinic-details-list');
        return {
            childrenCount: detailsList ? detailsList.children.length : 0,
            firstChildId: detailsList && detailsList.firstElementChild ? detailsList.firstElementChild.id : null
        };
    });
    
    console.log('\n📋 生成後の状態:', afterGeneration);
    
    console.log('\n🌐 ブラウザを開いたままにしています...');
    await new Promise(() => {});
})();