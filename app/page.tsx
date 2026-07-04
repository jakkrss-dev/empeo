// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  UploadCloud, FileSpreadsheet, Users, Activity, RefreshCw, 
  Clock, AlertCircle, Briefcase, CalendarCheck, UserCheck, Calendar, UserX,
  Search, Filter, CalendarDays, TrendingDown, Layers
} from 'lucide-react';

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let allRecords: any[] = [];
    let uploadedFileNames: string[] = [];
    const uniqueEmployees = new Map();

    for (const file of fileArray) {
      uploadedFileNames.push(file.name);
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        let currentDept = 'ไม่ระบุ';
        let currentEmpId = '';
        let currentEmpName = '';
        let colIdx = { id: 1, name: 4, pos: 8, date: 9, in: 10, out: 11 };

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

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;
            
            const idCol = row[colIdx.id];
            if (idCol === 'ฝ่าย') {
                const rawDept = String(row[colIdx.id + 2] || '');
                currentDept = rawDept.replace(/^\d+\s+/, '').trim();
                continue;
            }
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
            
            const dateCol = row[colIdx.date];
            if (dateCol && typeof dateCol === 'string' && dateCol.includes('/')) {
                const timeIn = row[colIdx.in];
                const timeOut = row[colIdx.out];
                
                const tInStr = timeIn ? String(timeIn).trim() : '';
                const tOutStr = timeOut ? String(timeOut).trim() : '';
                
                const isMissedIn = tInStr === '' || tInStr === '-';
                const isMissedOut = tOutStr === '' || tOutStr === '-';
                const isIncomplete = isMissedIn || isMissedOut;
                
                let isLate = false;
                if (tInStr && tInStr !== '-') {
                    let formattedIn = tInStr;
                    if (formattedIn.length === 4) formattedIn = '0' + formattedIn; 
                    if (formattedIn > '09:00') {
                        isLate = true;
                    }
                }
                
                let workHours = 0;
                if (!isIncomplete && tInStr.includes(':') && tOutStr.includes(':')) {
                    const [inH, inM] = tInStr.split(':').map(Number);
                    const [outH, outM] = tOutStr.split(':').map(Number);
                    let diff = (outH * 60 + outM) - (inH * 60 + inM);
                    if (diff < 0) diff += 24 * 60; 
                    workHours = parseFloat((diff / 60).toFixed(2));
                }

                allRecords.push({
                    empId: currentEmpId,
                    empName: currentEmpName,
                    dept: currentDept,
                    date: dateCol,
                    timeIn: tInStr || '-',
                    timeOut: tOutStr || '-',
                    isIncomplete: isIncomplete,
                    isMissedIn: isMissedIn,
                    isMissedOut: isMissedOut,
                    isLate: isLate,
                    workHours: workHours
                });
            }
        }
      } catch (error) {
        console.error(`เกิดข้อผิดพลาดกับไฟล์ ${file.name}:`, error);
      }
    }

    const uniqueRecordsMap = new Map();
    allRecords.forEach(rec => {
      uniqueRecordsMap.set(`${rec.empId}_${rec.date}`, rec);
    });
    const parsedRecords = Array.from(uniqueRecordsMap.values());

    if (parsedRecords.length === 0) {
        alert("ไม่พบข้อมูลเวลาเข้า-ออกงาน กรุณาตรวจสอบไฟล์ที่อัปโหลด");
        return;
    }

    const employees = Array.from(uniqueEmployees.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
    const uniqueDates = Array.from(new Set(parsedRecords.map(r => r.date))).sort();
    
    const employeeStats = employees.map((emp: any) => {
      const empRecs = parsedRecords.filter((r: any) => r.empId === emp.id);
      
      const missedInCount = empRecs.filter((r: any) => r.isMissedIn).length;
      const missedOutCount = empRecs.filter((r: any) => r.isMissedOut).length;
      
      return {
        ...emp,
        shortName: emp.name.split(' ')[0],
        totalDays: empRecs.length,
        incomplete: empRecs.filter((r: any) => r.isIncomplete).length,
        late: empRecs.filter((r: any) => r.isLate).length,
        missedInCount,
        missedOutCount,
      };
    }).sort((a, b) => (b.late + b.incomplete) - (a.late + a.incomplete));

    const deptCount: any = {};
    employees.forEach((emp: any) => { deptCount[emp.dept] = (deptCount[emp.dept] || 0) + 1; });
    const barChartData = Object.keys(deptCount).map(key => ({
        name: key, count: deptCount[key]
    })).sort((a, b) => b.count - a.count);

    const incompleteCount = parsedRecords.filter((r: any) => r.isIncomplete).length;
    const completeCount = parsedRecords.length - incompleteCount;
    const pieChartData = [
        { name: 'สแกนครบ', count: completeCount, color: '#10b981' }, 
        { name: 'ลืมสแกน', count: incompleteCount, color: '#ef4444' } 
    ];

    const displayFileName = uploadedFileNames.length > 1 
      ? `เลือกข้อมูลทั้งหมด ${uploadedFileNames.length} ไฟล์` 
      : uploadedFileNames[0];

    setDashboardData({
        totalRecords: parsedRecords.length,
        totalEmployees: employees.length,
        totalDepts: Object.keys(deptCount).length,
        incompleteScans: incompleteCount,
        barChartData,
        pieChartData,
        records: parsedRecords,
        employees: employees,
        uniqueDates: uniqueDates,
        employeeStats: employeeStats
    });
    setFileName(displayFileName);
    
    setSelectedEmpId(''); 
    setSearchTerm('');
    setFilterStatus('all');
    setSelectedDate('all');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { 
      handleMultipleFilesUpload(e.dataTransfer.files); 
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { 
      handleMultipleFilesUpload(e.target.files); 
    }
  };

  const getFilteredRecords = () => {
    if (!dashboardData) return [];
    return dashboardData.records.filter((row: any) => {
      const matchSearch = row.empName.toLowerCase().includes(searchTerm.toLowerCase()) || row.empId.includes(searchTerm);
      const matchDate = selectedDate === 'all' || row.date === selectedDate;
      
      let matchStatus = true;
      if (filterStatus === 'incomplete') matchStatus = row.isIncomplete;
      if (filterStatus === 'complete') matchStatus = !row.isIncomplete;
      if (filterStatus === 'late') matchStatus = row.isLate;

      return matchSearch && matchDate && matchStatus;
    });
  };

  if (!isMounted) return null;

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
              <p className="text-sm text-slate-500 font-medium">ระบบวิเคราะห์ข้อมูลเวลาเข้า-ออกงานอัตโนมัติ (รองรับหลายไฟล์)</p>
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
              <Layers className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">รายงานสรุปเวลาการเข้าออกงาน</h3>
            <p className="text-slate-500 mb-8 text-center max-w-md text-lg">
              สามารถลากและวาง <span className="font-semibold text-slate-700">หลายไฟล์พร้อมกัน</span> ลงที่นี่เพื่อรวมสถิติได้เลย
            </p>
            <label className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
              เลือกไฟล์จากเครื่อง (เลือกได้หลายไฟล์)
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" multiple onChange={onFileChange} />
            </label>
          </div>
        ) : (
          /* Dashboard Section */
          <div className="space-y-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* File Info */}
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 py-3 px-5 rounded-xl">
              <Layers className="text-blue-500 w-5 h-5" />
              <span>ดึงข้อมูลสำเร็จ: <strong className="text-slate-900">{fileName}</strong></span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
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

            {/* กราฟสรุปแบบจำนวนครั้ง */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    กราฟสรุปจำนวนการลืมทาบเข้า/ทาบออก
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">* นับเป็นจำนวนครั้งของพนักงานแต่ละคน</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.employeeStats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="shortName" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px' }} />
                      <Bar dataKey="missedInCount" name="ลืมทาบเข้า (ครั้ง)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missedOutCount" name="ลืมทาบออก (ครั้ง)" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    กราฟสรุปรวมพฤติกรรมการลงเวลา
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">* เปรียบเทียบวันทำงานทั้งหมด การมาสาย และลืมสแกน</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.employeeStats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="shortName" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px' }} />
                      <Bar dataKey="totalDays" name="วันทำงานทั้งหมด (วัน)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" name="มาสาย (ครั้ง)" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="incomplete" name="ลืมสแกน (ครั้ง)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Individual Employee Summary Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                  เจาะลึกข้อมูลการลงเวลารายบุคคล
                </h3>
                
                <div className="w-full md:w-72">
                  <select 
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block w-full p-3 font-medium cursor-pointer shadow-sm"
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                  >
                    <option value="">-- เลือกพนักงานเพื่อดูสรุป --</option>
                    {dashboardData.employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedEmpId ? (() => {
                const empRecords = dashboardData.records.filter((r: any) => r.empId === selectedEmpId);
                const totalDays = empRecords.length;
                const incomplete = empRecords.filter((r: any) => r.isIncomplete).length;
                const lateCount = empRecords.filter((r: any) => r.isLate).length;
                const complete = totalDays - incomplete;
                const chartData = empRecords.filter((r: any) => r.workHours > 0).sort((a: any, b: any) => a.date.localeCompare(b.date));

                return (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Calendar className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">วันทำงานทั้งหมด</p>
                          <p className="text-2xl font-bold text-slate-800">{totalDays} <span className="text-sm font-medium text-slate-500">วัน</span></p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><UserCheck className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">ลงเวลาครบถ้วน</p>
                          <p className="text-2xl font-bold text-emerald-600">{complete} <span className="text-sm font-medium text-slate-500">วัน</span></p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600"><TrendingDown className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">มาสาย</p>
                          <p className="text-2xl font-bold text-orange-600">{lateCount} <span className="text-sm font-medium text-slate-500">ครั้ง</span></p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full text-red-600"><UserX className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">ลืมสแกน (เข้า/ออก)</p>
                          <p className="text-2xl font-bold text-red-600">{incomplete} <span className="text-sm font-medium text-slate-500">ครั้ง</span></p>
                        </div>
                      </div>
                    </div>

                    {chartData.length > 0 && (
                      <div className="mt-8 mb-6 border border-slate-100 rounded-xl p-6 bg-slate-50/50">
                        <h4 className="text-md font-bold text-slate-700 mb-6 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-indigo-500" /> สถิติชั่วโมงการทำงานรายวัน
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                cursor={{fill: '#f1f5f9'}} 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                formatter={(value: number, name: string, props: any) => [
                                  `${value} ชั่วโมง (เข้า: ${props.payload.timeIn} - ออก: ${props.payload.timeOut})`, 
                                  'เวลาทำงาน'
                                ]}
                                labelFormatter={(label) => `วันที่: ${label}`}
                              />
                              <Bar dataKey="workHours" name="ชั่วโมงทำงาน" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={35} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>กรุณาเลือกชื่อพนักงานจาก Dropdown ด้านบนเพื่อดูสรุปรายบุคคล</p>
                </div>
              )}
            </div>

            {/* Overview Leaderboard Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
                  สรุปพฤติกรรมการลงเวลาภาพรวมทุกคน (Leaderboard)
                </h3>
                <p className="text-sm text-slate-500 mt-2 ml-4">รายชื่อจะเรียงตามจำนวนครั้งที่ลืมสแกนหรือมาสายมากที่สุดขึ้นก่อน</p>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4">พนักงาน</th>
                      <th className="px-6 py-4">แผนก</th>
                      <th className="px-6 py-4 text-center">วันทำงานทั้งหมด</th>
                      <th className="px-6 py-4 text-center">มาสาย</th>
                      <th className="px-6 py-4 text-center">ลืมสแกนนิ้ว</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.employeeStats.map((emp: any, idx: number) => (
                      <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="px-6 py-3 font-semibold text-slate-800">
                          {idx + 1}. {emp.name} <span className="text-xs font-normal text-slate-400 block">{emp.id}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-600">{emp.dept}</td>
                        <td className="px-6 py-3 text-center">{emp.totalDays}</td>
                        <td className="px-6 py-3 text-center">
                          {emp.late > 0 ? (
                            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">{emp.late}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {emp.incomplete > 0 ? (
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">{emp.incomplete}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Table with Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-slate-800 rounded-full"></span>
                  <h3 className="text-lg font-bold text-slate-800">รายการบันทึกเวลาทั้งหมด</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="ค้นหาชื่อ หรือ รหัส..." 
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select 
                      className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      <option value="all">ทุกวันที่</option>
                      {dashboardData.uniqueDates.map((d: string) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select 
                      className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="complete">สมบูรณ์ (ปกติ)</option>
                      <option value="late">มาสาย (&gt;09:00)</option>
                      <option value="incomplete">ลืมสแกน</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">วันที่</th>
                      <th className="px-6 py-4 whitespace-nowrap">พนักงาน</th>
                      <th className="px-6 py-4 whitespace-nowrap">แผนก</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">เวลาเข้า</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">เวลาออก</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">ชั่วโมงทำงาน</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredRecords().length > 0 ? getFilteredRecords().map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{row.date}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{row.empName}</div>
                          <div className="text-xs text-slate-400">รหัส: {row.empId}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{row.dept}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{row.timeIn}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{row.timeOut}</td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-600">
                          {row.workHours > 0 ? `${row.workHours} ชม.` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.isIncomplete ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              ลืมสแกน
                            </span>
                          ) : row.isLate ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                              มาสาย
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ปกติ
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                          ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                        </td>
                      </tr>
                    )}
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