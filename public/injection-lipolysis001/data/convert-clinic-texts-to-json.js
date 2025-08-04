const fs = require('fs');
const path = require('path');

// CSVファイルを読み込む関数（クリニック別横配置対応）
function readClinicCSV(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.trim().split('\n');
        
        if (lines.length < 3) {
            console.error('❌ CSVファイルの形式が正しくありません');
            return {};
        }
        
        // ヘッダー行を取得（1行目：項目名、2行目：説明、3行目：クリニック名）
        const itemNames = lines[0].split(',');
        const clinicNames = lines[2].split(','); // 3行目がクリニック名
        
        const result = {};
        
        // クリニック名をキーとして初期化（1列目は項目名なのでスキップ）
        for (let i = 2; i < clinicNames.length; i++) {
            const clinicName = clinicNames[i].trim();
            if (clinicName) {
                result[clinicName] = {};
            }
        }
        
        // 各行（4行目から）のデータを処理
        for (let lineIndex = 3; lineIndex < lines.length; lineIndex++) {
            const values = lines[lineIndex].split(',');
            const itemKey = values[0] ? values[0].trim() : '';
            
            if (!itemKey) continue;
            
            // 各クリニックのデータを格納
            for (let colIndex = 2; colIndex < values.length; colIndex++) {
                const clinicName = clinicNames[colIndex] ? clinicNames[colIndex].trim() : '';
                const value = values[colIndex] ? values[colIndex].trim() : '';
                
                if (clinicName && result[clinicName]) {
                    result[clinicName][itemKey] = value;
                }
            }
        }
        
        return result;
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
        return {};
    }
}

// JSONファイルに書き込む関数
function writeJSON(data, outputPath) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(outputPath, jsonData, 'utf8');
        console.log(`✅ クリニック別JSONファイルが作成されました: ${outputPath}`);
        
        // データの内容を表示
        console.log('\n📊 変換されたクリニックデータ:');
        Object.keys(data).forEach(clinicName => {
            console.log(`\n【${clinicName}】:`);
            const clinicData = data[clinicName];
            Object.keys(clinicData).slice(0, 5).forEach(key => { // 最初の5項目のみ表示
                const value = clinicData[key].length > 50 ? 
                    clinicData[key].substring(0, 50) + '...' : 
                    clinicData[key];
                console.log(`  ${key}: "${value}"`);
            });
            if (Object.keys(clinicData).length > 5) {
                console.log(`  ... 他${Object.keys(clinicData).length - 5}項目`);
            }
        });
        
    } catch (error) {
        console.error('JSONファイルの書き込みに失敗しました:', error);
    }
}

// メイン処理
function main() {
    const csvPath = path.join(__dirname, 'clinic-texts.csv');
    const jsonPath = path.join(__dirname, 'clinic-texts.json');
    
    console.log('🔄 clinic-texts.csv を JSON に変換中...');
    
    const data = readClinicCSV(csvPath);
    
    if (Object.keys(data).length === 0) {
        console.error('❌ クリニックデータが空です');
        return;
    }
    
    writeJSON(data, jsonPath);
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = { readClinicCSV, writeJSON, main };