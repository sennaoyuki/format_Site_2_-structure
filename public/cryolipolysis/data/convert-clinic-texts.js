#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CSVをパースする関数（csv-parseモジュール不要版）
 */
function parseCSV(content) {
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current); // 最後のフィールドを追加
        
        result.push(row);
    }
    
    return result;
}

/**
 * clinic-texts.csvをclinic-texts.jsonに変換するスクリプト
 */
function convertClinicTextsToJson() {
    // CSVファイルを読み込み
    const csvContent = fs.readFileSync(path.join(__dirname, 'clinic-texts.csv'), 'utf-8');
    
    // CSVをパース
    const records = parseCSV(csvContent);
    
    // ヘッダー行（クリニック名）を取得
    const headers = records[0];
    const clinicNames = headers.slice(2); // 最初の2列（項目、目的・注意事項）を除く
    
    // 結果オブジェクトを初期化
    const result = {};
    clinicNames.forEach(clinic => {
        result[clinic] = {};
    });
    
    // 各行を処理
    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        const itemKey = row[0]; // 項目名（キーとして使用）
        
        // 各クリニックのデータを格納
        for (let j = 0; j < clinicNames.length; j++) {
            const clinicName = clinicNames[j];
            const value = row[j + 2] || ''; // 値が無い場合は空文字
            result[clinicName][itemKey] = value;
        }
    }
    
    // JSONファイルとして保存
    const jsonPath = path.join(__dirname, 'clinic-texts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log('✅ clinic-texts.json を生成しました');
    console.log(`📍 保存先: ${jsonPath}`);
    console.log(`📊 クリニック数: ${clinicNames.length}`);
    
    // 各クリニックの項目数を表示
    clinicNames.forEach(clinic => {
        const itemCount = Object.keys(result[clinic]).length;
        console.log(`   - ${clinic}: ${itemCount}項目`);
    });
}

// 実行
try {
    convertClinicTextsToJson();
} catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
}