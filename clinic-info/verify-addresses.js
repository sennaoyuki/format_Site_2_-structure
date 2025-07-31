const fs = require('fs').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const path = require('path');

// 住所検証関数
async function verifyAddresses(csvFilePath) {
  const results = [];
  const issues = {
    missingPostalCode: [],
    incompleteAddress: [],
    missingBuildingInfo: [],
    suspiciousAddress: []
  };
  
  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        const clinic = {
          clinicName: data['クリニック名'],
          branchName: data['店舗名'],
          postalCode: data['郵便番号'],
          address: data['住所'],
          access: data['アクセス'],
          businessHours: data['営業時間'],
          holidays: data['定休日']
        };
        
        // 検証ロジック
        const validationResult = {
          ...clinic,
          issues: []
        };
        
        // 1. 郵便番号チェック
        if (!clinic.postalCode || clinic.postalCode.trim() === '') {
          validationResult.issues.push('郵便番号なし');
          issues.missingPostalCode.push(clinic);
        } else if (!clinic.postalCode.match(/〒\d{3}-\d{4}/)) {
          validationResult.issues.push('郵便番号形式エラー');
        }
        
        // 2. 住所完全性チェック
        if (!clinic.address || clinic.address.trim() === '') {
          validationResult.issues.push('住所なし');
          issues.incompleteAddress.push(clinic);
        } else {
          // 番地が含まれているかチェック
          if (!clinic.address.match(/\d+(-\d+)?(-\d+)?/)) {
            validationResult.issues.push('番地なし');
            issues.incompleteAddress.push(clinic);
          }
          
          // ビル名・階数チェック（オプション）
          if (!clinic.address.match(/(ビル|ビルディング|タワー|プラザ|センター|館)/)) {
            validationResult.issues.push('ビル名なし（要確認）');
            issues.missingBuildingInfo.push(clinic);
          }
        }
        
        // 3. 特定の疑わしいパターン
        if (clinic.clinicName === '共立美容外科' && 
            clinic.branchName === '札幌院' && 
            clinic.address && clinic.address.includes('北区')) {
          validationResult.issues.push('住所要確認（札幌駅周辺は通常中央区）');
          issues.suspiciousAddress.push(clinic);
        }
        
        results.push(validationResult);
      })
      .on('end', async () => {
        // 検証結果のサマリー
        const summary = {
          totalClinics: results.length,
          clinicsWithIssues: results.filter(r => r.issues.length > 0).length,
          issueBreakdown: {
            missingPostalCode: issues.missingPostalCode.length,
            incompleteAddress: issues.incompleteAddress.length,
            missingBuildingInfo: issues.missingBuildingInfo.length,
            suspiciousAddress: issues.suspiciousAddress.length
          }
        };
        
        // レポート生成
        const report = {
          summary,
          issues,
          allResults: results
        };
        
        // JSONレポートを保存
        const reportPath = path.join(__dirname, 'address-verification-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`検証レポートを保存しました: ${reportPath}`);
        
        // 問題のあるデータをCSVで出力
        const issuesCSV = results
          .filter(r => r.issues.length > 0)
          .map(r => {
            return [
              r.clinicName,
              r.branchName,
              r.postalCode || '',
              r.address || '',
              r.issues.join('; ')
            ].join(',');
          })
          .join('\n');
        
        const issuesCSVPath = path.join(__dirname, 'address-issues.csv');
        await fs.writeFile(
          issuesCSVPath, 
          'クリニック名,店舗名,郵便番号,住所,問題点\n' + issuesCSV, 
          'utf-8'
        );
        console.log(`問題のあるデータを保存しました: ${issuesCSVPath}`);
        
        // コンソールにサマリーを表示
        console.log('\n=== 住所検証サマリー ===');
        console.log(`総クリニック数: ${summary.totalClinics}`);
        console.log(`問題のあるクリニック数: ${summary.clinicsWithIssues}`);
        console.log('\n問題の内訳:');
        console.log(`- 郵便番号なし: ${summary.issueBreakdown.missingPostalCode}`);
        console.log(`- 住所不完全: ${summary.issueBreakdown.incompleteAddress}`);
        console.log(`- ビル名なし: ${summary.issueBreakdown.missingBuildingInfo}`);
        console.log(`- 要確認住所: ${summary.issueBreakdown.suspiciousAddress}`);
        
        resolve(report);
      })
      .on('error', reject);
  });
}

// 実行
if (require.main === module) {
  const csvPath = path.join(__dirname, 'stores.csv');
  
  verifyAddresses(csvPath)
    .then(() => console.log('\n検証が完了しました'))
    .catch(error => console.error('エラーが発生しました:', error));
}

module.exports = { verifyAddresses };