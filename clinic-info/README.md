# Clinic Info Scraper

LULA美容クリニックの店舗情報をスクレイピングするツールです。

## ファイル構成

- `lula_clinics.csv` - クリニック情報のCSVファイル（手動作成）
- `scrape-clinics.js` - Webサイトからクリニック情報をスクレイピングするスクリプト
- `convert-csv-to-json.js` - CSVファイルをJSON形式に変換するスクリプト
- `package.json` - 依存関係の定義

## 使い方

### 1. 依存関係のインストール

```bash
npm install
```

### 2. スクレイピングの実行

```bash
npm run scrape
```

これにより以下のファイルが生成されます：
- `lula_clinics_scraped.csv` - スクレイピングしたデータのCSV
- `lula_clinics_scraped.json` - スクレイピングしたデータのJSON

### 3. CSVからJSONへの変換

```bash
npm run convert
```

`lula_clinics.csv`を`lula_clinics.json`に変換します。

## データ形式

### CSV形式
```
クリニック名,店舗名,郵便番号,住所,アクセス,営業時間,定休日
```

### JSON形式
```json
{
  "clinicName": "LULA美容クリニック",
  "branchName": "渋谷本院",
  "postalCode": "〒150-0043",
  "address": "東京都渋谷区道玄坂1丁目12-1 渋谷マークシティウェスト14階",
  "access": "渋谷駅直結",
  "businessHours": "10:00-19:00（最終受付18:00）",
  "holidays": "不定休"
}
```