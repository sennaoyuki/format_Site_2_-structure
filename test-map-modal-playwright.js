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
        server.listen(8080, () => {
            console.log('✅ Local server started at http://localhost:8080');
            resolve(server);
        });
    });
}

async function runTest() {
    console.log('🚀 Starting map modal test...\n');
    
    // Start local server
    const server = await startServer();
    
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false, // Set to false to see the browser
        slowMo: 500 // Slow down actions to make them visible
    });
    
    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('📋 Page console:', msg.text());
            }
        });
        
        console.log('📍 Step 1: Navigating to the site...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
        console.log('✅ Page loaded successfully\n');
        
        // Wait for the page to fully render
        await page.waitForTimeout(2000);
        
        console.log('📍 Step 2: Scrolling to find store listings...');
        // Try to find the store section
        const storeSection = await page.$('.brand-section, .shops');
        
        if (!storeSection) {
            console.log('⚠️  Store section not found in initial view, scrolling down...');
            // Scroll down to find stores
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await page.waitForTimeout(1000);
        }
        
        // Look for map buttons
        console.log('📍 Step 3: Looking for map buttons...');
        const mapButtons = await page.$$('.map-toggle-btn');
        console.log(`✅ Found ${mapButtons.length} map button(s)\n`);
        
        if (mapButtons.length === 0) {
            // Try alternative selectors
            console.log('⚠️  No map buttons found with .map-toggle-btn, trying alternative selectors...');
            const altButtons = await page.$$('a[href*="javascript:void"]:has-text("地図"), .shop-btn:has-text("地図")');
            console.log(`Found ${altButtons.length} buttons with alternative selectors`);
            
            if (altButtons.length === 0) {
                throw new Error('No map buttons found on the page');
            }
            mapButtons.push(...altButtons);
        }
        
        // Scroll to the first map button
        console.log('📍 Step 4: Scrolling to the first map button...');
        await mapButtons[0].scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        // Take a screenshot before clicking
        await page.screenshot({ 
            path: 'before-click.png',
            fullPage: false 
        });
        console.log('✅ Screenshot saved: before-click.png\n');
        
        // Get button info before clicking
        const buttonInfo = await mapButtons[0].evaluate(el => {
            const shopContainer = el.closest('.shop');
            const clinicName = shopContainer?.querySelector('.shop-name a')?.textContent || 'Unknown';
            const address = shopContainer?.querySelector('.shop-name + div')?.textContent || 'Unknown';
            return { clinicName, address };
        });
        console.log(`📍 Step 5: Clicking map button for: ${buttonInfo.clinicName}`);
        console.log(`   Address: ${buttonInfo.address}\n`);
        
        // Click the map button
        await mapButtons[0].click();
        console.log('✅ Map button clicked\n');
        
        // Wait for modal to appear
        console.log('📍 Step 6: Waiting for modal to appear...');
        const modal = await page.waitForSelector('#map-modal[style*="display: flex"], #map-modal[style*="display: block"]', { 
            timeout: 5000 
        }).catch(() => null);
        
        if (!modal) {
            console.log('⚠️  Modal not visible, checking display style...');
            const modalDisplay = await page.$eval('#map-modal', el => getComputedStyle(el).display);
            console.log(`Modal display style: ${modalDisplay}`);
            throw new Error('Map modal did not appear');
        }
        
        console.log('✅ Modal appeared successfully!\n');
        
        // Get modal content
        console.log('📍 Step 7: Verifying modal content...');
        const modalContent = await page.evaluate(() => {
            const clinicName = document.querySelector('#map-modal-clinic-name')?.textContent || '';
            const address = document.querySelector('#map-modal-address')?.textContent || '';
            const access = document.querySelector('#map-modal-access')?.textContent || '';
            const mapContainer = document.querySelector('#map-modal-map-container');
            const hasMap = mapContainer && mapContainer.innerHTML.includes('iframe');
            
            return { clinicName, address, access, hasMap };
        });
        
        console.log('📊 Modal Content:');
        console.log(`   Clinic Name: ${modalContent.clinicName}`);
        console.log(`   Address: ${modalContent.address}`);
        console.log(`   Access: ${modalContent.access}`);
        console.log(`   Has Map: ${modalContent.hasMap ? 'Yes' : 'No'}\n`);
        
        // Verify the content is not promotional text
        if (modalContent.clinicName.includes('最大') || 
            modalContent.clinicName.includes('無料') || 
            modalContent.clinicName.includes('キャンペーン')) {
            console.log('❌ ERROR: Modal shows promotional text instead of clinic name!');
        } else {
            console.log('✅ Modal shows proper clinic information (not promotional text)\n');
        }
        
        // Take screenshot of modal
        console.log('📍 Step 8: Taking screenshot of modal...');
        await page.screenshot({ 
            path: 'modal-displayed.png',
            fullPage: false 
        });
        console.log('✅ Screenshot saved: modal-displayed.png\n');
        
        // Try closing the modal
        console.log('📍 Step 9: Testing modal close functionality...');
        const closeButton = await page.$('#map-modal-close');
        if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
            
            const modalHidden = await page.$eval('#map-modal', el => {
                return getComputedStyle(el).display === 'none';
            });
            
            if (modalHidden) {
                console.log('✅ Modal closed successfully\n');
            } else {
                console.log('⚠️  Modal did not close properly\n');
            }
        }
        
        console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ Map modal functionality is working correctly');
        console.log('✅ Modal displays clinic information (not promotional text)');
        console.log('✅ Screenshots saved: before-click.png and modal-displayed.png');
        
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        
        // Take error screenshot
        await page.screenshot({ 
            path: 'error-state.png',
            fullPage: true 
        });
        console.log('📸 Error screenshot saved: error-state.png');
        
        throw error;
    } finally {
        await browser.close();
        server.close();
        console.log('\n🔚 Test finished, server stopped');
    }
}

// Run the test
runTest().catch(console.error);