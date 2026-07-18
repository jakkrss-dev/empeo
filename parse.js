const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('./public/data.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// The report might have header rows at the top. 
// Convert with header: 1 to get array of arrays
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('--- FIRST 20 ROWS ---');
for (let i = 0; i < Math.min(20, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
}
