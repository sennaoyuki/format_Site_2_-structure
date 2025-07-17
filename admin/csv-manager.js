/**
 * CSVデータ処理ロジック
 * Papa Parse使用、バリデーション、重複チェック機能付き
 */

class CSVManager {
    constructor() {
        this.validFileTypes = ['.csv', 'text/csv', 'application/csv'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.csvSchemas = {
            regions: ['parameter_no', 'region'],
            clinics: ['id', 'name', 'code'],
            stores: ['id', 'name', 'clinicName', 'address', 'zipcode', 'access', 'region_id'],
            rankings: ['region_id', 'no1', 'no2', 'no3'],
            store_views: ['store_id', 'region_id', 'visibility']
        };
    }

    /**
     * CSVファイルをパースする
     */
    async parseCSV(file, dataType) {
        return new Promise((resolve, reject) => {
            // ファイルバリデーション
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                reject(new Error(validation.error));
                return;
            }

            // スキーマバリデーション
            if (!this.csvSchemas[dataType]) {
                reject(new Error(`未対応のデータ型: ${dataType}`));
                return;
            }

            // Papa Parse設定
            const config = {
                header: true,
                skipEmptyLines: true,
                encoding: 'UTF-8',
                transformHeader: (header) => header.trim(),
                transform: (value) => value.trim(),
                complete: (results) => {
                    try {
                        // エラーチェック
                        if (results.errors.length > 0) {
                            const errorMessages = results.errors.map(err => 
                                `行 ${err.row + 1}: ${err.message}`
                            ).join('\n');
                            reject(new Error(`CSV解析エラー:\n${errorMessages}`));
                            return;
                        }

                        // スキーマバリデーション
                        const schemaValidation = this.validateSchema(results.data, dataType);
                        if (!schemaValidation.isValid) {
                            reject(new Error(schemaValidation.error));
                            return;
                        }

                        // データ型チェック
                        const typeValidation = this.validateDataTypes(results.data, dataType);
                        if (!typeValidation.isValid) {
                            reject(new Error(typeValidation.error));
                            return;
                        }

                        // 重複チェック
                        const duplicateValidation = this.checkDuplicates(results.data, dataType);
                        if (!duplicateValidation.isValid) {
                            reject(new Error(duplicateValidation.error));
                            return;
                        }

                        resolve({
                            data: results.data,
                            meta: results.meta
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`ファイル読み込みエラー: ${error.message}`));
                }
            };

            // Papa Parseでファイルを解析
            Papa.parse(file, config);
        });
    }

    /**
     * ファイルバリデーション
     */
    validateFile(file) {
        // ファイルサイズチェック
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `ファイルサイズが制限を超えています (最大: ${this.maxFileSize / (1024 * 1024)}MB)`
            };
        }

        // ファイル型チェック
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isValidType = this.validFileTypes.includes(fileExtension) || 
                          this.validFileTypes.includes(file.type);

        if (!isValidType) {
            return {
                isValid: false,
                error: 'CSVファイルのみアップロード可能です'
            };
        }

        return { isValid: true };
    }

    /**
     * スキーマバリデーション
     */
    validateSchema(data, dataType) {
        if (!data || data.length === 0) {
            return {
                isValid: false,
                error: 'CSVファイルが空です'
            };
        }

        const expectedColumns = this.csvSchemas[dataType];
        const actualColumns = Object.keys(data[0]);

        // 必須列の存在チェック
        const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length > 0) {
            return {
                isValid: false,
                error: `必須列が不足しています: ${missingColumns.join(', ')}`
            };
        }

        return { isValid: true };
    }

    /**
     * データ型バリデーション
     */
    validateDataTypes(data, dataType) {
        const errors = [];

        data.forEach((row, index) => {
            switch (dataType) {
                case 'regions':
                    if (!row.parameter_no || !/^\d{3}$/.test(row.parameter_no)) {
                        errors.push(`行 ${index + 2}: parameter_noは3桁の数字である必要があります`);
                    }
                    if (!row.region || row.region.length === 0) {
                        errors.push(`行 ${index + 2}: regionは必須です`);
                    }
                    break;

                case 'clinics':
                    if (!row.id || row.id.length === 0) {
                        errors.push(`行 ${index + 2}: idは必須です`);
                    }
                    if (!row.name || row.name.length === 0) {
                        errors.push(`行 ${index + 2}: nameは必須です`);
                    }
                    break;

                case 'stores':
                    if (!row.id || row.id.length === 0) {
                        errors.push(`行 ${index + 2}: idは必須です`);
                    }
                    if (!row.region_id || !/^\d{3}$/.test(row.region_id)) {
                        errors.push(`行 ${index + 2}: region_idは3桁の数字である必要があります`);
                    }
                    break;

                case 'rankings':
                    if (!row.region_id || !/^\d{3}$/.test(row.region_id)) {
                        errors.push(`行 ${index + 2}: region_idは3桁の数字である必要があります`);
                    }
                    break;
            }
        });

        if (errors.length > 0) {
            return {
                isValid: false,
                error: errors.join('\n')
            };
        }

        return { isValid: true };
    }

    /**
     * 重複チェック
     */
    checkDuplicates(data, dataType) {
        const duplicates = [];
        const seen = new Set();

        data.forEach((row, index) => {
            let key;
            switch (dataType) {
                case 'regions':
                    key = row.parameter_no;
                    break;
                case 'clinics':
                case 'stores':
                    key = row.id;
                    break;
                case 'rankings':
                    key = row.region_id;
                    break;
                case 'store_views':
                    key = `${row.store_id}_${row.region_id}`;
                    break;
                default:
                    return { isValid: true };
            }

            if (seen.has(key)) {
                duplicates.push(`行 ${index + 2}: 重複するキー "${key}"`);
            } else {
                seen.add(key);
            }
        });

        if (duplicates.length > 0) {
            return {
                isValid: false,
                error: `重複データが検出されました:\n${duplicates.join('\n')}`
            };
        }

        return { isValid: true };
    }

    /**
     * CSVデータをJSON形式に変換
     */
    convertToJSON(data, dataType) {
        try {
            return data.map(row => {
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    cleanRow[key] = this.sanitizeValue(row[key]);
                });
                return cleanRow;
            });
        } catch (error) {
            throw new Error(`JSON変換エラー: ${error.message}`);
        }
    }

    /**
     * 値のサニタイズ（XSS対策）
     */
    sanitizeValue(value) {
        if (typeof value !== 'string') return value;
        
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * データの統計情報を取得
     */
    getDataStatistics(data) {
        return {
            totalRows: data.length,
            columns: Object.keys(data[0] || {}),
            columnCount: Object.keys(data[0] || {}).length,
            memoryUsage: JSON.stringify(data).length
        };
    }

    /**
     * データプレビューを生成
     */
    generatePreview(data, maxRows = 5) {
        return {
            headers: Object.keys(data[0] || {}),
            rows: data.slice(0, maxRows),
            hasMore: data.length > maxRows,
            totalRows: data.length
        };
    }
}

// Papa Parse CDNチェック
if (typeof Papa === 'undefined') {
    console.warn('Papa Parse CDNが読み込まれていません。HTMLに以下を追加してください:');
    console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>');
}

// グローバルエクスポート
window.CSVManager = CSVManager;