const fs = require('fs');
const path = require('path');

// CSVファイルを読み込む関数（共通テキスト用）
function readCommonCSV(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.trim().split('\n');
        
        if (lines.length < 2) {
            console.error('❌ CSVファイルの形式が正しくありません');
            return {};
        }
        
        const result = {};
        
        // 各行のデータを処理（ヘッダー行をスキップ）
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3) {
                const key = values[0].trim();
                const value = values[2].trim();
                if (key) {
                    result[key] = value;
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
        console.log(`✅ 共通テキストJSONファイルが作成されました: ${outputPath}`);
        
        // データの内容を表示
        console.log('\n📊 変換された共通テキストデータ:');
        Object.keys(data).forEach(key => {
            const value = data[key].length > 50 ? 
                data[key].substring(0, 50) + '...' : 
                data[key];
            console.log(`  ${key}: "${value}"`);
        });
        
    } catch (error) {
        console.error('JSONファイルの書き込みに失敗しました:', error);
    }
}

// メイン処理
function main() {
    const csvPath = path.join(__dirname, 'site-common-texts.csv');
    const jsonPath = path.join(__dirname, 'site-common-texts.json');
    
    console.log('🔄 site-common-texts.csv を JSON に変換中...');
    
    const data = readCommonCSV(csvPath);
    
    if (Object.keys(data).length === 0) {
        console.error('❌ 共通テキストデータが空です');
        return;
    }
    
    writeJSON(data, jsonPath);
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = { readCommonCSV, writeJSON, main };