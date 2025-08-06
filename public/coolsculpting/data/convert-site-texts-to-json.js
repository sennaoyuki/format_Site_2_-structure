const fs = require('fs');
const path = require('path');

// CSVファイルを読み込む関数
function readCSV(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',');
        
        const result = {};
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            
            const regionId = row.region_id;
            const elementId = row.element_id;
            
            if (!result[regionId]) {
                result[regionId] = {};
            }
            
            result[regionId][elementId] = row.text_content;
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
        console.log(`✅ JSONファイルが作成されました: ${outputPath}`);
        
        // データの内容を表示
        console.log('\n📊 変換されたデータ:');
        Object.keys(data).forEach(regionId => {
            console.log(`\nRegion ${regionId}:`);
            Object.keys(data[regionId]).forEach(elementId => {
                console.log(`  ${elementId}: "${data[regionId][elementId]}"`);
            });
        });
        
    } catch (error) {
        console.error('JSONファイルの書き込みに失敗しました:', error);
    }
}

// メイン処理
function main() {
    const csvPath = path.join(__dirname, 'site-texts.csv');
    const jsonPath = path.join(__dirname, 'site-texts.json');
    
    console.log('🔄 site-texts.csv を JSON に変換中...');
    
    const data = readCSV(csvPath);
    
    if (Object.keys(data).length === 0) {
        console.error('❌ CSVデータが空です');
        return;
    }
    
    writeJSON(data, jsonPath);
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = { readCSV, writeJSON, main };