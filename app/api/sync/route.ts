import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    // 1. รันสคริปต์ Python เพื่อดึงข้อมูลใหม่
    // ใช้คำสั่ง python ปกติและ path ต้องถูกต้อง
    await execPromise('python "D:\\empeo data\\empeo.py"');
    
    // 2. หาไฟล์ล่าสุดในโฟลเดอร์ Downloads
    const downloadsDir = 'C:\\Users\\Asus\\Downloads';
    const files = fs.readdirSync(downloadsDir);
    const excelFiles = files.filter(f => f.startsWith('Attendance_Report_') && f.endsWith('.xlsx'));
    
    if (excelFiles.length === 0) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รายงานใน Downloads' }, { status: 404 });
    }
    
    // เรียงตามเวลาล่าสุด
    excelFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(downloadsDir, a));
      const statB = fs.statSync(path.join(downloadsDir, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    
    const latestFile = excelFiles[0];
    const filePath = path.join(downloadsDir, latestFile);
    const fileBuffer = fs.readFileSync(filePath);
    
    // ส่งไฟล์กลับไปให้ Frontend
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(latestFile)}"`,
        'X-Filename': encodeURIComponent(latestFile)
      }
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}
