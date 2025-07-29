const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static file server
function startServer() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
            } else {
                let contentType = 'text/html';
                if (filePath.endsWith('.js')) contentType = 'application/javascript';
                else if (filePath.endsWith('.css')) contentType = 'text/css';
                else if (filePath.endsWith('.json')) contentType = 'application/json';
                else if (filePath.endsWith('.png')) contentType = 'image/png';
                else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
                else if (filePath.endsWith('.webp')) contentType = 'image/webp';
                
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });
    
    return new Promise((resolve) => {
        server.listen(8081, () => {
            console.log('✅ Local server started at http://localhost:8081');
            resolve(server);
        });
    });
}

async function runTest() {
    console.log('🚀 Starting enhanced map modal test...\n');
    
    // Start local server
    const server = await startServer();
    
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false, // Set to false to see the browser
        slowMo: 300 // Slow down actions to make them visible
    });
    
    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();
        
        console.log('📍 Step 1: Navigating to the site...');
        await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
        console.log('✅ Page loaded successfully\n');
        
        // Wait for the page to fully render
        await page.waitForTimeout(2000);
        
        console.log('📍 Step 2: Finding the first map button in store listings...');
        
        // Wait for store listings to be visible
        await page.waitForSelector('.brand-section, .shops', { timeout: 10000 });
        
        // Scroll to the store section
        const storeSection = await page.$('.brand-section, .shops');
        if (storeSection) {
            await storeSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
        }
        
        // Find the first map button
        const mapButton = await page.waitForSelector('.map-toggle-btn', { timeout: 5000 });
        console.log('✅ Found map button\n');
        
        // Get store information
        const storeInfo = await mapButton.evaluate(btn => {
            const shopContainer = btn.closest('.shop');
            if (!shopContainer) return null;
            
            const clinicLink = shopContainer.querySelector('.shop-name a');
            const clinicName = clinicLink ? clinicLink.textContent.trim() : 'Unknown';
            const addressDiv = shopContainer.querySelector('.shop-name + div');
            const address = addressDiv ? addressDiv.textContent.trim() : 'Unknown';
            
            return { clinicName, address };
        });
        
        console.log('📍 Step 3: Store information:');
        console.log(`   Clinic: ${storeInfo.clinicName}`);
        console.log(`   Address: ${storeInfo.address}\n`);
        
        // Take screenshot before clicking
        await page.screenshot({ 
            path: 'test-before-modal.png',
            fullPage: false 
        });
        console.log('✅ Screenshot saved: test-before-modal.png\n');
        
        console.log('📍 Step 4: Clicking the map button...');
        await mapButton.click();
        console.log('✅ Map button clicked\n');
        
        // Wait for modal with multiple strategies
        console.log('📍 Step 5: Waiting for modal to appear...');
        
        // Strategy 1: Wait for modal to be visible
        await page.waitForFunction(() => {
            const modal = document.querySelector('#map-modal');
            if (!modal) return false;
            const style = window.getComputedStyle(modal);
            return style.display !== 'none' && (style.display === 'flex' || style.display === 'block');
        }, { timeout: 5000 });
        
        console.log('✅ Modal is now visible!\n');
        
        // Wait a bit for animation
        await page.waitForTimeout(500);
        
        // Get modal information
        console.log('📍 Step 6: Checking modal content...');
        const modalInfo = await page.evaluate(() => {
            const modal = document.querySelector('#map-modal');
            const modalContent = document.querySelector('.map-modal-content');
            const clinicName = document.querySelector('#map-modal-clinic-name')?.textContent || '';
            const address = document.querySelector('#map-modal-address')?.textContent || '';
            const access = document.querySelector('#map-modal-access')?.textContent || '';
            const mapIframe = document.querySelector('#map-modal-map-container iframe');
            
            // Get modal z-index and position
            const modalStyle = window.getComputedStyle(modal);
            const contentStyle = modalContent ? window.getComputedStyle(modalContent) : null;
            
            return {
                clinicName: clinicName.trim(),
                address: address.trim(),
                access: access.trim(),
                hasMap: !!mapIframe,
                modalZIndex: modalStyle.zIndex,
                modalPosition: modalStyle.position,
                modalDisplay: modalStyle.display,
                contentZIndex: contentStyle ? contentStyle.zIndex : 'N/A',
                mapIframeSrc: mapIframe ? mapIframe.src.substring(0, 50) + '...' : 'No iframe'
            };
        });
        
        console.log('📊 Modal Information:');
        console.log(`   Clinic Name: "${modalInfo.clinicName}"`);
        console.log(`   Address: "${modalInfo.address}"`);
        console.log(`   Access: "${modalInfo.access}"`);
        console.log(`   Has Map iframe: ${modalInfo.hasMap}`);
        console.log(`   Modal z-index: ${modalInfo.modalZIndex}`);
        console.log(`   Modal position: ${modalInfo.modalPosition}`);
        console.log(`   Modal display: ${modalInfo.modalDisplay}`);
        console.log(`   Map iframe src: ${modalInfo.mapIframeSrc}\n`);
        
        // Verify content is correct
        const hasProperContent = modalInfo.clinicName && 
                               !modalInfo.clinicName.includes('最大') && 
                               !modalInfo.clinicName.includes('無料') &&
                               !modalInfo.clinicName.includes('キャンペーン');
        
        if (hasProperContent) {
            console.log('✅ Modal displays proper clinic information\n');
        } else {
            console.log('❌ Modal content appears to be incorrect or promotional\n');
        }
        
        // Take screenshot of modal
        console.log('📍 Step 7: Taking screenshot of modal...');
        
        // First, let's highlight the modal for better visibility
        await page.evaluate(() => {
            const modal = document.querySelector('.map-modal-content');
            if (modal) {
                modal.style.border = '3px solid red';
                modal.style.boxShadow = '0 0 20px rgba(255,0,0,0.5)';
            }
        });
        
        await page.screenshot({ 
            path: 'test-modal-visible.png',
            fullPage: false 
        });
        console.log('✅ Screenshot saved: test-modal-visible.png\n');
        
        // Also take a screenshot of just the modal content
        const modalElement = await page.$('.map-modal-content');
        if (modalElement) {
            await modalElement.screenshot({ path: 'test-modal-content-only.png' });
            console.log('✅ Modal content screenshot saved: test-modal-content-only.png\n');
        }
        
        // Test closing
        console.log('📍 Step 8: Testing modal close...');
        const closeButton = await page.$('#map-modal-close');
        if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
            
            const isClosed = await page.evaluate(() => {
                const modal = document.querySelector('#map-modal');
                return modal && window.getComputedStyle(modal).display === 'none';
            });
            
            console.log(isClosed ? '✅ Modal closed successfully\n' : '⚠️ Modal did not close\n');
        }
        
        console.log('🎉 TEST COMPLETED!');
        console.log('\n📊 Summary:');
        console.log('- Map button click: ✅ Working');
        console.log('- Modal display: ✅ Visible');
        console.log(`- Modal content: ${hasProperContent ? '✅ Shows clinic info' : '❌ Shows promotional text'}`);
        console.log('- Modal map: ' + (modalInfo.hasMap ? '✅ Map iframe present' : '❌ No map'));
        console.log('\n📸 Screenshots saved:');
        console.log('- test-before-modal.png');
        console.log('- test-modal-visible.png');
        console.log('- test-modal-content-only.png');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        
        // Take error screenshot
        await page.screenshot({ 
            path: 'test-error-state.png',
            fullPage: true 
        });
        console.log('📸 Error screenshot saved: test-error-state.png');
        
        // Try to get more debug info
        const debugInfo = await page.evaluate(() => {
            const modal = document.querySelector('#map-modal');
            const buttons = document.querySelectorAll('.map-toggle-btn');
            return {
                modalExists: !!modal,
                modalDisplay: modal ? window.getComputedStyle(modal).display : 'N/A',
                buttonCount: buttons.length,
                pageTitle: document.title
            };
        });
        console.log('\nDebug info:', debugInfo);
        
        throw error;
    } finally {
        await browser.close();
        server.close();
        console.log('\n🔚 Browser closed, server stopped');
    }
}

// Run the test
runTest().catch(console.error);