const { chromium } = require('playwright');

(async () => {
  const url = process.env.TEST_URL || 'http://127.0.0.1:61338/injection-lipolysis001/?region_id=013&gclid=text_gclid1111&utm_creative=creative2222&max_scroll=25&detail_click=%E3%83%87%E3%82%A3%E3%82%AA%E3%82%AF%E3%83%AA%E3%83%8B%E3%83%83%E3%82%AF&detail_rank=1&comparison_tab=%E7%B7%8F%E5%90%88#clinic1';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Opening: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 主要DOMのレンダリング待ち
    await page.waitForTimeout(1500);

    // 動的生成待ち
    await page.waitForSelector('.detail-item h3', { timeout: 20000 });

    // ウララ/URARAの詳細セクションを特定
    const uraraSection = page.locator('.detail-item').filter({
      has: page.locator('h3', { hasText: /ウララ|URARA/ })
    }).first();

    await uraraSection.waitFor({ state: 'visible', timeout: 20000 });

    // セクション内の地図ボタンをクリック
    const mapBtn = uraraSection.locator('.map-toggle-btn').first();
    await mapBtn.scrollIntoViewIfNeeded();
    await mapBtn.click({ timeout: 10000 });

    // モーダルが開くのを待機
    const modal = page.locator('#map-modal');
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // モーダルの院名を取得して検証
    const modalTitle = await page.locator('#map-modal-clinic-name').innerText();
    console.log('Modal clinic name:', modalTitle);

    if (!/ウララ/.test(modalTitle)) {
      throw new Error(`想定外のクリニック名が表示されています: ${modalTitle}`);
    }

    console.log('✅ 地図モーダルはウララクリニックとして表示されました');
  } catch (err) {
    console.error('❌ テスト失敗:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
