const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// 画像をダウンロードする関数
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = require('fs').createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        fileStream.on('error', reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// クリニックの画像を検索・ダウンロード
async function downloadClinicImages(csvFilePath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 画像保存用ディレクトリを作成
    const imagesDir = path.join(__dirname, 'clinic-images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    const clinics = [];
    
    // CSVを読み込み
    await new Promise((resolve, reject) => {
      createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          clinics.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`${clinics.length}件のクリニック画像をダウンロード開始...`);
    
    for (let i = 0; i < clinics.length; i++) {
      const clinic = clinics[i];
      const identifier = clinic['店舗識別子'];
      const clinicName = clinic['クリニック名'];
      const branchName = clinic['店舗名'];
      const imageFilename = clinic['画像ファイル名'];
      
      console.log(`[${i + 1}/${clinics.length}] ${identifier}: ${clinicName} ${branchName}`);
      
      try {
        // Google画像検索で検索
        const searchQuery = `${clinicName} ${branchName} 外観 クリニック`;
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // 最初の画像を取得
        const imageUrl = await page.evaluate(() => {
          const img = document.querySelector('img[data-src], img[src]');
          return img ? (img.dataset.src || img.src) : null;
        });
        
        if (imageUrl && imageUrl.startsWith('http')) {
          const imagePath = path.join(imagesDir, imageFilename);
          await downloadImage(imageUrl, imagePath);
          console.log(`  ✓ ダウンロード完了: ${imageFilename}`);
        } else {
          console.log(`  ✗ 画像が見つかりませんでした`);
          
          // デフォルト画像を作成（SVGプレースホルダー）
          const defaultSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f0f0f0"/>
            <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
              ${clinicName}
            </text>
          </svg>`;
          
          const placeholderPath = path.join(imagesDir, imageFilename.replace('.jpg', '.svg'));
          await fs.writeFile(placeholderPath, defaultSvg, 'utf-8');
          console.log(`  ✓ プレースホルダー作成: ${placeholderPath}`);
        }
        
        // リクエスト間隔を空ける
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`  ✗ エラー: ${error.message}`);
      }
    }
    
    console.log('\n画像ダウンロード完了！');
    
  } catch (error) {
    console.error('画像ダウンロード中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// より安全な画像ダウンロード（公式サイトから）
async function downloadClinicImagesFromOfficialSites(csvFilePath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 画像保存用ディレクトリを作成
    const imagesDir = path.join(__dirname, 'clinic-images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    const clinics = [];
    
    // CSVを読み込み
    await new Promise((resolve, reject) => {
      createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          clinics.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // クリニック別の公式サイト
    const officialSites = {
      'LULA美容クリニック': 'https://www.lula-beauty.jp/',
      '共立美容外科': 'https://www.kyoritsu-biyo.com/',
      '東京美容外科': 'https://www.tkc110.jp/',
      'フェミークリニック': 'https://femmy-cl.com/',
      '聖心美容クリニック': 'https://www.seishin-biyou.jp/'
    };
    
    console.log(`${clinics.length}件のクリニック画像をダウンロード開始...`);
    
    for (let i = 0; i < clinics.length; i++) {
      const clinic = clinics[i];
      const identifier = clinic['店舗識別子'];
      const clinicName = clinic['クリニック名'];
      const branchName = clinic['店舗名'];
      const imageFilename = clinic['画像ファイル名'];
      
      console.log(`[${i + 1}/${clinics.length}] ${identifier}: ${clinicName} ${branchName}`);
      
      try {
        const officialSite = officialSites[clinicName];
        if (officialSite) {
          await page.goto(officialSite, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // サイトのロゴや代表的な画像を取得
          const imageUrl = await page.evaluate(() => {
            // ロゴやメイン画像を探す
            const logoSelectors = [
              'img[alt*="ロゴ"]',
              'img[alt*="logo"]',
              '.logo img',
              '.header img',
              '.main-visual img',
              'img[src*="logo"]',
              'img:first-of-type'
            ];
            
            for (const selector of logoSelectors) {
              const img = document.querySelector(selector);
              if (img && img.src && img.src.startsWith('http')) {
                return img.src;
              }
            }
            
            return null;
          });
          
          if (imageUrl) {
            const imagePath = path.join(imagesDir, imageFilename);
            await downloadImage(imageUrl, imagePath);
            console.log(`  ✓ ダウンロード完了: ${imageFilename}`);
          } else {
            console.log(`  ✗ 画像が見つかりませんでした`);
          }
        }
        
        // リクエスト間隔を空ける
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ✗ エラー: ${error.message}`);
      }
    }
    
    console.log('\n画像ダウンロード完了！');
    
  } catch (error) {
    console.error('画像ダウンロード中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// 実行
if (require.main === module) {
  const csvPath = path.join(__dirname, 'stores_with_identifiers.csv');
  
  console.log('クリニック画像のダウンロードを開始します...');
  console.log('注意: 画像の使用については各クリニックの利用規約を確認してください。\n');
  
  downloadClinicImagesFromOfficialSites(csvPath)
    .then(() => console.log('すべての処理が完了しました'))
    .catch(error => console.error('エラーが発生しました:', error));
}

module.exports = { downloadClinicImages, downloadClinicImagesFromOfficialSites };