'use client';

import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  UploadCloud, FileSpreadsheet, Users, Activity, RefreshCw, 
  Clock, AlertCircle, Briefcase, CalendarCheck 
} from 'lucide-react';

export default function Dashboard() {
  // 1. เพิ่ม State สำหรับตรวจสอบว่าเว็บโหลดเสร็จหรือยัง (ป้องกัน Error)
  const [isMounted, setIsMounted] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // 2. สั่งให้ระบบรู้ว่า Component พร้อมทำงานบนฝั่ง Client แล้ว
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // อัลกอริทึมสำหรับแกะข้อมูลไฟล์ Empeo Report โดยเฉพาะ
  const processEmpeoData = (rows: any[], name: string) => {
    if (!rows || rows.length === 0) return;

    let currentDept = 'ไม่ระบุ';
    let currentEmpId = '';
    let currentEmpName = '';
    
    const parsedRecords = [];
    const uniqueEmployees = new Map();
    
    // กำหนด Index ของคอลัมน์เริ่มต้น
    let colIdx = { id: 1, name: 4, pos: 8, date: 9, in: 10, out: 11 };

    // 1. ค้นหาบรรทัด Header เพื่อจับคู่คอลัมน์ให้แม่นยำ
    for (let r = 0; r < Math.min(rows.length, 30); r++) {
      const row = rows[r];
      if (row && row.includes('รหัส') && row.includes('วันที่')) {
        colIdx.id = row.indexOf('รหัส');
        colIdx.name = row.indexOf('ชื่อ - นามสกุล') > -1 ? row.indexOf('ชื่อ - นามสกุล') : colIdx.id + 3;
        colIdx.pos = row.indexOf('ตำแหน่ง') > -1 ? row.indexOf('ตำแหน่ง') : colIdx.id + 7;
        colIdx.date = row.indexOf('วันที่');
        colIdx.in = row.indexOf('ครั้งที่ 1') > -1 ? row.indexOf('ครั้งที่ 1') : colIdx.date + 1;
        colIdx.out = row.indexOf('ครั้งที่ 2') > -1 ? row.indexOf('ครั้งที่ 2') : colIdx.date + 2;
        break;
      }
    }

    // 2. ดึงข้อมูลทีละบรรทัด
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;
        
        const idCol = row[colIdx.id];
        
        // เช็คว่าเป็นบรรทัด "ฝ่าย" หรือไม่
        if (idCol === 'ฝ่าย') {
            const rawDept = String(row[colIdx.id + 2] || '');
            currentDept = rawDept.replace(/^\d+\s+/, '').trim(); // ลบตัวเลขรหัสแผนกด้านหน้าออก
            continue;
        }
        
        // เช็คว่าเป็นบรรทัดเริ่มข้อมูลพนักงานใหม่หรือไม่
        if (idCol && idCol !== 'รหัส' && idCol !== 'ฝ่าย' && row[colIdx.name]) {
            currentEmpId = String(idCol).trim();
            currentEmpName = String(row[colIdx.name]).trim();
            const currentPosition = String(row[colIdx.pos] || 'ไม่ระบุ').trim();
            
            if (!uniqueEmployees.has(currentEmpId)) {
                uniqueEmployees.set(currentEmpId, {
                    id: currentEmpId, name: currentEmpName, dept: currentDept, position: currentPosition
                });
            }
        }
        
        // เช็คว่าเป็นบรรทัดเวลาเข้าออกหรือไม่ (ดูจากวันที่)
        const dateCol = row[colIdx.date];
        if (dateCol && typeof dateCol === 'string' && dateCol.includes('/')) {
            const timeIn = row[colIdx.in];
            const timeOut = row[colIdx.out];
            
            // ตรวจสอบว่าลืมสแกนไหม
            const tInStr = timeIn ? String(timeIn).trim() : '';
            const tOutStr = timeOut ? String(timeOut).trim() : '';
            const isIncomplete = tInStr === '' || tOutStr === '';
            
            parsedRecords.push({
                empId: currentEmpId,
                empName: currentEmpName,
                dept: currentDept,
                date: dateCol,
                timeIn: tInStr || '-',
                timeOut: tOutStr || '-',
                isIncomplete: isIncomplete
            });
        }
    }

    if (parsedRecords.length === 0) {
        alert("ไม่พบข้อมูลเวลาเข้า-ออกงาน กรุณาตรวจสอบว่าอัปโหลดไฟล์ผิดหรือไม่");
        return;
    }

    // --- เตรียมข้อมูลลง Dashboard ---
    const employees = Array.from(uniqueEmployees.values());
    
    // สร้าง Data สำหรับกราฟแท่ง (พนักงานแต่ละแผนก)
    const deptCount: any = {};
    employees.forEach((emp: any) => { deptCount[emp.dept] = (deptCount[emp.dept] || 0) + 1; });
    const barChartData = Object.keys(deptCount).map(key => ({
        name: key, count: deptCount[key]
    })).sort((a, b) => b.count - a.count);

    // สร้าง Data สำหรับกราฟวงกลม (สถิติการสแกน)
    const incompleteCount = parsedRecords.filter(r => r.isIncomplete).length;
    const completeCount = parsedRecords.length - incompleteCount;
    const pieChartData = [
        { name: 'สแกนครบ (เข้าและออก)', count: completeCount, color: '#10b981' }, 
        { name: 'ลืมสแกน (อย่างใดอย่างหนึ่ง)', count: incompleteCount, color: '#ef4444' } 
    ];

    setDashboardData({
        totalRecords: parsedRecords.length,
        totalEmployees: employees.length,
        totalDepts: Object.keys(deptCount).length,
        incompleteScans: incompleteCount,
        barChartData,
        pieChartData,
        records: parsedRecords 
    });
    setFileName(name);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        processEmpeoData(json, file.name);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("เกิดข้อผิดพลาดในการประมวลผลไฟล์");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileUpload(e.dataTransfer.files[0]); }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { handleFileUpload(e.target.files[0]); }
  };

  // 3. ป้องกัน Hydration Error โดยรอให้ Mount เสร็จก่อนถึงจะ Render หน้าจอ
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-blue-200 shadow-lg">
              <CalendarCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Empeo Attendance Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">ระบบวิเคราะห์ข้อมูลเวลาเข้า-ออกงานอัตโนมัติ</p>
            </div>
          </div>
          
          {dashboardData && (
            <button 
              onClick={() => setDashboardData(null)}
              className="flex items-center gap-2 text-sm bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full font-medium transition-all shadow-sm border border-slate-200 hover:shadow"
            >
              <RefreshCw className="w-4 h-4" /> อัปโหลดไฟล์ใหม่
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Upload Section */}
        {!dashboardData ? (
          <div 
            className={`mt-12 border-2 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center transition-all duration-300
              ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50 hover:shadow-lg'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <div className={`p-5 rounded-full mb-6 transition-colors duration-300 ${isDragging ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <UploadCloud className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">รายงานสรุปเวลาการเข้าออกงาน</h3>
            <p className="text-slate-500 mb-8 text-center max-w-md text-lg">
              ลากและวางไฟล์ <span className="font-semibold text-slate-700">Excel (จาก Empeo)</span> ลงที่นี่
            </p>
            <label className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
              เลือกไฟล์จากเครื่อง
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileChange} />
            </label>
          </div>
        ) : (
          /* Dashboard Section */
          <div className="space-y-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* File Info */}
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 py-3 px-5 rounded-xl">
              <FileSpreadsheet className="text-blue-500 w-5 h-5" />
              <span>ดึงข้อมูลสำเร็จจากไฟล์: <strong className="text-slate-900">{fileName}</strong></span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="w-24 h-24" /></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">พนักงานทั้งหมด</p>
                </div>
                <h4 className="text-4xl font-extrabold text-slate-800">{dashboardData.totalEmployees} <span className="text-lg font-medium text-slate-500">คน</span></h4>
              </div>

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Clock className="w-24 h-24" /></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600"><Clock className="w-5 h-5" /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">รายการบันทึกเวลา</p>
                </div>
                <h4 className="text-4xl font-extrabold text-slate-800">{dashboardData.totalRecords} <span className="text-lg font-medium text-slate-500">ครั้ง</span></h4>
              </div>

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle className="w-24 h-24" /></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2.5 rounded-lg text-red-600"><AlertCircle className="w-5 h-5" /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">ลืมสแกนเข้า/ออก</p>
                </div>
                <h4 className="text-4xl font-extrabold text-red-600">{dashboardData.incompleteScans} <span className="text-lg font-medium text-slate-500">ครั้ง</span></h4>
              </div>

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Briefcase className="w-24 h-24" /></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600"><Briefcase className="w-5 h-5" /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">จำนวนแผนก</p>
                </div>
                <h4 className="text-4xl font-extrabold text-slate-800">{dashboardData.totalDepts} <span className="text-lg font-medium text-slate-500">แผนก</span></h4>
              </div>

            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Bar Chart */}
              <div className="lg:col-span-3 bg-white p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  จำนวนพนักงานแยกตามแผนก
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} angle={-25} textAnchor="end" />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="count" name="พนักงาน (คน)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="lg:col-span-2 bg-white p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  คุณภาพการสแกนนิ้ว
                </h3>
                <div className="h-80 w-full flex flex-col justify-center items-center">
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie 
                        data={dashboardData.pieChartData} 
                        cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={3} dataKey="count"
                      >
                        {dashboardData.pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Data Preview Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-slate-800 rounded-full"></span>
                  <h3 className="text-lg font-bold text-slate-800">รายการบันทึกเวลา (แสดง 50 รายการแรก)</h3>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">วันที่</th>
                      <th className="px-6 py-4 whitespace-nowrap">พนักงาน</th>
                      <th className="px-6 py-4 whitespace-nowrap">แผนก</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">เวลาเข้า</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">เวลาออก</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.records.slice(0, 50).map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{row.date}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{row.empName}</div>
                          <div className="text-xs text-slate-400">รหัส: {row.empId}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{row.dept}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{row.timeIn}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{row.timeOut}</td>
                        <td className="px-6 py-4 text-center">
                          {row.isIncomplete ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              ลืมสแกน
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              สมบูรณ์
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}