const fs = require('fs').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const path = require('path');

// CSVファイルをJSONに変換する関数
async function convertCsvToJson(csvFilePath, jsonFilePath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // データを整形
        const formattedData = {
          clinicName: data['クリニック名'],
          branchName: data['店舗名'],
          postalCode: data['郵便番号'],
          address: data['住所'],
          access: data['アクセス'],
          businessHours: data['営業時間'],
          holidays: data['定休日']
        };
        results.push(formattedData);
      })
      .on('end', async () => {
        try {
          // JSON形式で保存
          await fs.writeFile(jsonFilePath, JSON.stringify(results, null, 2), 'utf-8');
          console.log(`変換完了: ${jsonFilePath}`);
          console.log(`合計 ${results.length} 件のクリニック情報を変換しました`);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// 実行
if (require.main === module) {
  const csvPath = path.join(__dirname, 'lula_clinics.csv');
  const jsonPath = path.join(__dirname, 'lula_clinics.json');
  
  convertCsvToJson(csvPath, jsonPath)
    .then(() => console.log('変換が完了しました'))
    .catch(error => console.error('エラーが発生しました:', error));
}

module.exports = { convertCsvToJson };