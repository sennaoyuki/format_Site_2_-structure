const fs = require('fs').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const path = require('path');

// クリニック名から識別子プレフィックスを生成
function getClinicPrefix(clinicName) {
  const prefixMap = {
    'LULA美容クリニック': 'LULA',
    '共立美容外科': 'KBC',  // Kyoritsu Beauty Clinic
    '東京美容外科': 'TBS',  // Tokyo Beauty Surgery
    'フェミークリニック': 'FEMMY',
    '聖心美容クリニック': 'SEISHIN'
  };
  
  return prefixMap[clinicName] || 'OTHER';
}

// CSVに識別子と画像ファイル名列を追加
async function addIdentifiersToCSV(inputPath, outputPath) {
  const results = [];
  const clinicCounters = {}; // 各クリニックチェーンのカウンター
  
  return new Promise((resolve, reject) => {
    createReadStream(inputPath)
      .pipe(csv())
      .on('data', (data) => {
        const clinicName = data['クリニック名'];
        const prefix = getClinicPrefix(clinicName);
        
        // カウンターを初期化または増加
        if (!clinicCounters[prefix]) {
          clinicCounters[prefix] = 1;
        } else {
          clinicCounters[prefix]++;
        }
        
        // 識別子を生成（例: LULA_001）
        const identifier = `${prefix}_${String(clinicCounters[prefix]).padStart(3, '0')}`;
        
        // 画像ファイル名を生成
        const imageFilename = `${identifier}.jpg`;
        
        // データに追加
        const updatedData = {
          '店舗識別子': identifier,
          'クリニック名': data['クリニック名'],
          '店舗名': data['店舗名'],
          '郵便番号': data['郵便番号'],
          '住所': data['住所'],
          'アクセス': data['アクセス'],
          '営業時間': data['営業時間'],
          '定休日': data['定休日'],
          '画像ファイル名': imageFilename
        };
        
        results.push(updatedData);
      })
      .on('end', async () => {
        try {
          // CSVヘッダー
          const csvHeader = '店舗識別子,クリニック名,店舗名,郵便番号,住所,アクセス,営業時間,定休日,画像ファイル名\n';
          
          // CSV行を生成
          const csvRows = results.map(row => {
            return [
              row['店舗識別子'],
              row['クリニック名'],
              row['店舗名'],
              row['郵便番号'],
              row['住所'],
              row['アクセス'],
              row['営業時間'],
              row['定休日'],
              row['画像ファイル名']
            ].map(field => {
              // カンマや改行を含む場合はダブルクォートで囲む
              if (field && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
                return `"${field.replace(/"/g, '""')}"`;
              }
              return field || '';
            }).join(',');
          }).join('\n');
          
          const csvContent = csvHeader + csvRows;
          
          // 新しいCSVファイルを保存
          await fs.writeFile(outputPath, csvContent, 'utf-8');
          console.log(`新しいCSVファイルを保存しました: ${outputPath}`);
          
          // 統計情報を表示
          console.log('\n=== 店舗識別子生成完了 ===');
          console.log(`総店舗数: ${results.length}`);
          console.log('\n各クリニックの店舗数:');
          Object.entries(clinicCounters).forEach(([prefix, count]) => {
            console.log(`- ${prefix}: ${count}店舗`);
          });
          
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
  const inputPath = path.join(__dirname, 'stores.csv');
  const outputPath = path.join(__dirname, 'stores_with_identifiers.csv');
  
  addIdentifiersToCSV(inputPath, outputPath)
    .then(() => console.log('\n識別子の追加が完了しました'))
    .catch(error => console.error('エラーが発生しました:', error));
}

module.exports = { addIdentifiersToCSV };