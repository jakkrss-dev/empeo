const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('./public/data.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

const rawRecords = data.slice(6);

// Helper to convert Excel serial date to readable string
function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial;
    // Excel date bug (leap year 1900), offset is usually 25569
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const cleanedData = rawRecords.filter(row => row[0]).map(row => {
  return {
    id: row[0],
    name: row[1],
    company: row[2],
    department: row[3],
    date: excelDateToJSDate(row[5]),
    shift: row[6],
    timeIn: row[7],
    timeOut: row[8],
    status: row[9],
    workDayType: row[10],
    workMins: row[11] || 0,
    lateMins: row[12] || 0,
    leaveEarlyMins: row[13] || 0,
    absentMins: row[14] || 0,
    document: row[18] || '',
  };
});

fs.writeFileSync('./public/data.json', JSON.stringify(cleanedData, null, 2));
console.log('Successfully generated public/data.json with', cleanedData.length, 'records.');
