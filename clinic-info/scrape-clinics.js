const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// クリニック情報をスクレイピングする関数
async function scrapeClinics() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('LULAクリニックのページにアクセス中...');
    await page.goto('https://www.lula-beauty.jp/clinic/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // クリニック情報を抽出
    const clinics = await page.evaluate(() => {
      const clinicData = [];
      
      // 各クリニックカードを取得
      const clinicCards = document.querySelectorAll('.clinic-card, .clinic-item, [class*="clinic"]');
      
      clinicCards.forEach(card => {
        const clinic = {
          clinicName: 'LULA美容クリニック',
          branchName: '',
          postalCode: '',
          address: '',
          access: '',
          businessHours: '10:00-19:00',
          holidays: '不定休'
        };

        // 店舗名を取得
        const nameElement = card.querySelector('h3, h4, .clinic-name, .title');
        if (nameElement) {
          clinic.branchName = nameElement.textContent.trim();
        }

        // 住所情報を取得
        const addressElement = card.querySelector('.address, .clinic-address, [class*="address"]');
        if (addressElement) {
          const addressText = addressElement.textContent.trim();
          // 郵便番号を抽出
          const postalMatch = addressText.match(/〒\d{3}-\d{4}/);
          if (postalMatch) {
            clinic.postalCode = postalMatch[0];
            clinic.address = addressText.replace(postalMatch[0], '').trim();
          } else {
            clinic.address = addressText;
          }
        }

        // アクセス情報を取得
        const accessElement = card.querySelector('.access, .station, [class*="access"]');
        if (accessElement) {
          clinic.access = accessElement.textContent.trim();
        }

        // 営業時間を取得
        const hoursElement = card.querySelector('.hours, .business-hours, [class*="time"]');
        if (hoursElement) {
          clinic.businessHours = hoursElement.textContent.trim();
        }

        // 定休日を取得
        const holidayElement = card.querySelector('.holiday, .closed, [class*="holiday"]');
        if (holidayElement) {
          clinic.holidays = holidayElement.textContent.trim();
        }

        if (clinic.branchName) {
          clinicData.push(clinic);
        }
      });

      return clinicData;
    });

    console.log(`${clinics.length}件のクリニック情報を取得しました`);

    // CSV形式に変換
    const csvHeader = 'クリニック名,店舗名,郵便番号,住所,アクセス,営業時間,定休日\n';
    const csvRows = clinics.map(clinic => {
      return [
        clinic.clinicName,
        clinic.branchName,
        clinic.postalCode,
        clinic.address,
        clinic.access,
        clinic.businessHours,
        clinic.holidays
      ].map(field => {
        // カンマや改行を含む場合はダブルクォートで囲む
        if (field.includes(',') || field.includes('\n') || field.includes('"')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // CSVファイルを保存
    const outputPath = path.join(__dirname, 'lula_clinics_scraped.csv');
    await fs.writeFile(outputPath, csvContent, 'utf-8');
    console.log(`CSVファイルを保存しました: ${outputPath}`);

    // JSON形式でも保存
    const jsonPath = path.join(__dirname, 'lula_clinics_scraped.json');
    await fs.writeFile(jsonPath, JSON.stringify(clinics, null, 2), 'utf-8');
    console.log(`JSONファイルを保存しました: ${jsonPath}`);

  } catch (error) {
    console.error('スクレイピング中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// 実行
if (require.main === module) {
  scrapeClinics().catch(console.error);
}

module.exports = { scrapeClinics };