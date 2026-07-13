// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, RefreshCw, Clock, AlertCircle, Briefcase, CalendarCheck, UserCheck, Calendar, UserX,
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
    const savedData = localStorage.getItem('empeoDashboardData');
    const savedFileName = localStorage.getItem('empeoFileName');
    
    if (savedData && savedFileName) {
      try {
        setDashboardData(JSON.parse(savedData));
        setFileName(savedFileName);
      } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลที่บันทึกไว้ได้", error);
        localStorage.removeItem('empeoDashboardData');
        localStorage.removeItem('empeoFileName');
      }
    }
  }, []);

  // ฟังก์ชันส่วนกลางสำหรับเรียงวันที่ DD/MM/YYYY ตามลำดับปฏิทินจริง
  const sortDatesChronologically = (aStr: string, bStr: string) => {
    const [d1, m1, y1] = aStr.split('/').map(Number);
    const [d2, m2, y2] = bStr.split('/').map(Number);
    if (y1 !== y2) return y1 - y2;
    if (m1 !== m2) return m1 - m2;
    return d1 - d2;
  };

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
                const rawDept = String(row[colIdx.id + 2] || '').trim();
                currentDept = rawDept || 'ไม่ระบุ';
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
                    if (formattedIn > '08:30') isLate = true;
                }
                
                let workHours = 0;
                let diffMins = 0;
                let workHoursText = '-';

                if (!isIncomplete && tInStr.includes(':') && tOutStr.includes(':')) {
                    const [inH, inM] = tInStr.split(':').map(Number);
                    const [outH, outM] = tOutStr.split(':').map(Number);
                    let diff = (outH * 60 + outM) - (inH * 60 + inM);
                    if (diff < 0) diff += 24 * 60; 
                    
                    diff = diff > 60 ? diff - 60 : 0;
                    diffMins = diff;
                    
                    const h = Math.floor(diff / 60);
                    const m = diff % 60;
                    
                    if (h > 0 && m > 0) {
                        workHoursText = `${h} ชั่วโมง ${m} นาที`;
                    } else if (h > 0) {
                        workHoursText = `${h} ชั่วโมง`;
                    } else {
                        workHoursText = `${m} นาที`;
                    }

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
                    diffMins: diffMins,
                    workHours: workHours,
                    workHoursText: workHoursText
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
    
    // [แก้ไขจุดที่ 1] เรียงลำดับรายการบันทึกเวลาทั้งหมดจากอดีตไปหาปัจจุบัน
    const parsedRecords = Array.from(uniqueRecordsMap.values()).sort((a, b) => 
      sortDatesChronologically(a.date, b.date)
    );

    if (parsedRecords.length === 0) {
        alert("ไม่พบข้อมูลเวลาเข้า-ออกงาน กรุณาตรวจสอบไฟล์ที่อัปโหลด");
        return;
    }

    const employees = Array.from(uniqueEmployees.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    // [แก้ไขจุดที่ 2] เรียงลำดับตัวเลือกวันที่ใน Dropdown ตามปฏิทินจริง
    const uniqueDates = Array.from(new Set(parsedRecords.map(r => r.date))).sort(sortDatesChronologically);
    
    const employeeStats = employees.map((emp: any) => {
      const empRecs = parsedRecords.filter((r: any) => r.empId === emp.id);
      
      const missedInCount = empRecs.filter((r: any) => r.isMissedIn).length;
      const missedOutCount = empRecs.filter((r: any) => r.isMissedOut).length;
      
      const totalMins = empRecs.reduce((sum: number, r: any) => sum + (r.diffMins || 0), 0);
      const totalH = Math.floor(totalMins / 60);
      const totalM = totalMins % 60;
      
      let totalWorkHoursText = '';
      if (totalH > 0 && totalM > 0) {
          totalWorkHoursText = `${totalH} ชั่วโมง ${totalM} นาที`;
      } else if (totalH > 0) {
          totalWorkHoursText = `${totalH} ชั่วโมง`;
      } else {
          totalWorkHoursText = `${totalM} นาที`;
      }
      
      return {
        ...emp,
        shortName: emp.name.split(' ')[0],
        totalDays: empRecs.length,
        incomplete: empRecs.filter((r: any) => r.isIncomplete).length,
        late: empRecs.filter((r: any) => r.isLate).length,
        missedInCount,
        missedOutCount,
        totalWorkHoursText: totalWorkHoursText,
        totalWorkHours: parseFloat((totalMins / 60).toFixed(2)) 
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

    const newData = {
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
    };

    setDashboardData(newData);
    setFileName(displayFileName);

    try {
      localStorage.setItem('empeoDashboardData', JSON.stringify(newData));
      localStorage.setItem('empeoFileName', displayFileName);
    } catch (error) {
      console.warn("ขนาดไฟล์อาจใหญ่เกินกว่าจะบันทึกแบบถาวรในเบราว์เซอร์ได้ แต่ยังคงแสดงผลได้ปกติครับ", error);
    }
    
    setSelectedEmpId(''); 
    setSearchTerm('');
    setFilterStatus('all');
    setSelectedDate('all');
  };

  const clearData = () => {
    setDashboardData(null);
    setFileName(null);
    localStorage.removeItem('empeoDashboardData');
    localStorage.removeItem('empeoFileName');
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

  let empTotalDays = 0, empComplete = 0, empLateCount = 0, empIncomplete = 0;
  let empChartData: any[] = [];
  
  if (dashboardData && selectedEmpId) {
    const empRecords = dashboardData.records.filter((r: any) => String(r.empId) === String(selectedEmpId));
    empTotalDays = empRecords.length;
    empIncomplete = empRecords.filter((r: any) => r.isIncomplete).length;
    empLateCount = empRecords.filter((r: any) => r.isLate).length;
    empComplete = empTotalDays - empIncomplete;
    
    // [แก้ไขจุดที่ 3] เรียงแกนเวลารายวันในกราฟเจาะลึกบุคคลจากเก่าไปใหม่ตามปฏิทินจริง
    empChartData = empRecords
      .filter((r: any) => r.workHours > 0)
      .sort((a: any, b: any) => sortDatesChronologically(a.date, b.date));
  }

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
              onClick={clearData}
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
            <p className="text-slate