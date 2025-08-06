const fs = require('fs');
const path = require('path');

// CSVパーサー（複雑なCSV形式に対応）
function parseComplexCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // ヘッダー行を解析
    const headers = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < lines[0].length; i++) {
        const char = lines[0][i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            headers.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    if (currentValue) {
        headers.push(currentValue.trim());
    }

    const data = [];

    // データ行を解析
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const values = [];
        currentValue = '';
        inQuotes = false;
        
        for (let i = 0; i < lines[lineIndex].length; i++) {
            const char = lines[lineIndex][i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        if (currentValue) {
            values.push(currentValue.trim());
        }

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        data.push(obj);
    }

    return data;
}

// メイン処理
async function convertTextsCSVtoJSON() {
    console.log('📍 テキストCSV → JSON変換開始...\n');

    // 現在のディレクトリ（dataディレクトリ）を使用
    const dataDir = __dirname;
    
    try {
        // 1. 共通テキストデータ
        console.log('1️⃣ 共通テキストデータを読み込み中...');
        const commonTextsCSV = fs.readFileSync(path.join(dataDir, 'site-common-texts.csv'), 'utf8');
        const commonTextsData = parseComplexCSV(commonTextsCSV);
        
        // 共通テキストをオブジェクトに変換
        const commonTexts = {};
        commonTextsData.forEach(row => {
            if (row['項目名'] && row['値']) {
                commonTexts[row['項目名']] = row['値'];
            }
        });
        console.log(`   ✅ ${Object.keys(commonTexts).length}件の共通テキスト項目`);

        // 2. クリニック別テキストデータ
        console.log('\n2️⃣ クリニック別テキストデータを読み込み中...');
        const clinicTextsCSV = fs.readFileSync(path.join(dataDir, 'clinic-texts.csv'), 'utf8');
        const clinicTextsData = parseComplexCSV(clinicTextsCSV);
        
        // クリニック別テキストを構造化
        const clinicTexts = {
            dio: {},
            eminal: {},
            urara: {},
            lieto: {},
            sbc: {}
        };
        
        // クリニックコードを取得
        const clinicCodes = {};
        const codeRow = clinicTextsData.find(row => row['項目'] === 'クリニックコード');
        if (codeRow) {
            clinicCodes['ディオクリニック'] = codeRow['ディオクリニック'];
            clinicCodes['エミナルクリニック'] = codeRow['エミナルクリニック'];
            clinicCodes['ウララクリニック'] = codeRow['ウララクリニック'];
            clinicCodes['リエートクリニック'] = codeRow['リエートクリニック'];
            clinicCodes['湘南美容クリニック'] = codeRow['湘南美容クリニック'];
        }
        
        clinicTextsData.forEach(row => {
            const itemName = row['項目'];
            if (itemName && itemName !== 'クリニックコード') {
                Object.keys(clinicCodes).forEach(clinicName => {
                    const code = clinicCodes[clinicName];
                    if (code && clinicTexts[code]) {
                        clinicTexts[code][itemName] = row[clinicName] || '';
                    }
                });
            }
        });
        
        console.log(`   ✅ ${Object.keys(clinicTexts).length}クリニック分のテキストデータ`);

        // 3. JSONファイルに出力
        console.log('\n📝 JSONファイルに出力中...');
        
        // 共通テキストJSON
        const commonTextsPath = path.join(dataDir, 'site-common-texts.json');
        fs.writeFileSync(commonTextsPath, JSON.stringify(commonTexts, null, 2), 'utf8');
        const commonSize = (fs.statSync(commonTextsPath).size / 1024).toFixed(2);
        console.log(`   ✅ site-common-texts.json (${commonSize} KB)`);
        
        // クリニック別テキストJSON
        const clinicTextsPath = path.join(dataDir, 'clinic-texts.json');
        fs.writeFileSync(clinicTextsPath, JSON.stringify(clinicTexts, null, 2), 'utf8');
        const clinicSize = (fs.statSync(clinicTextsPath).size / 1024).toFixed(2);
        console.log(`   ✅ clinic-texts.json (${clinicSize} KB)`);

        console.log('\n✅ 変換完了！');
        console.log('\n📊 統計情報:');
        console.log(`   共通テキスト項目数: ${Object.keys(commonTexts).length}`);
        Object.keys(clinicTexts).forEach(code => {
            console.log(`   ${code}: ${Object.keys(clinicTexts[code]).length}項目`);
        });

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        process.exit(1);
    }
}

// 実行
convertTextsCSVtoJSON();