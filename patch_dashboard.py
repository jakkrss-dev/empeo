import re

with open(r'D:\empeo data\empeo3\empeo-dashboardnpx\app\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
state_injection = """  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');"""
content = re.sub(r'const \[selectedEmpId, setSelectedEmpId\] = useState<string>\(\'\'\);', state_injection, content)

# 2. Add displayData useMemo
hook_injection = """
  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    const parts = dStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      return new Date(y, m - 1, d);
    }
    return null;
  };

  const displayData = useMemo(() => {
    if (!dashboardData) return null;
    if (!startDate && !endDate) return dashboardData;
    
    const startObj = startDate ? new Date(startDate) : new Date('2000-01-01');
    startObj.setHours(0, 0, 0, 0);
    const endObj = endDate ? new Date(endDate) : new Date('2100-01-01');
    endObj.setHours(23, 59, 59, 999);
    
    const filteredRecords = dashboardData.allRecords.filter((r: any) => {
      const rd = parseDate(r.date);
      return rd && rd >= startObj && rd <= endObj;
    });
    
    const deptCount: any = {};
    const employees = dashboardData.employees;
    
    const employeeStats = employees.map((emp: any) => {
      const empRecs = filteredRecords.filter((r: any) => r.empId === emp.id);
      
      const missedInCount = empRecs.filter((r: any) => r.isMissedIn).length;
      const missedOutCount = empRecs.filter((r: any) => r.isMissedOut).length;
      const totalMins = empRecs.reduce((sum: number, r: any) => sum + (r.diffMins || 0), 0);
      const totalH = Math.floor(totalMins / 60);
      const totalM = totalMins % 60;
      
      let totalWorkHoursText = '';
      if (totalH > 0 && totalM > 0) totalWorkHoursText = `${totalH} ชั่วโมง ${totalM} นาที`;
      else if (totalH > 0) totalWorkHoursText = `${totalH} ชั่วโมง`;
      else totalWorkHoursText = `${totalM} นาที`;
      
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
    }).sort((a: any, b: any) => (b.late + b.incomplete) - (a.late + a.incomplete));

    const activeEmployees = employeeStats.filter((emp: any) => emp.totalDays > 0);
    activeEmployees.forEach((emp: any) => { deptCount[emp.dept] = (deptCount[emp.dept] || 0) + 1; });
    const barChartData = Object.keys(deptCount).map(key => ({
        name: key, count: deptCount[key]
    })).sort((a, b) => b.count - a.count);

    const incompleteCount = filteredRecords.filter((r: any) => r.isIncomplete).length;
    const completeCount = filteredRecords.length - incompleteCount;
    const pieChartData = [
        { name: 'สแกนครบ', count: completeCount, color: '#10b981' }, 
        { name: 'ลืมสแกน', count: incompleteCount, color: '#ef4444' } 
    ];

    return {
      ...dashboardData,
      records: filteredRecords,
      totalRecords: filteredRecords.length,
      totalEmployees: activeEmployees.length,
      totalDepts: Object.keys(deptCount).length,
      incompleteScans: incompleteCount,
      employeeStats,
      barChartData,
      pieChartData
    };
  }, [dashboardData, startDate, endDate]);

  const currentData = useMemo(() => {"""
content = content.replace("  const currentData = useMemo(() => {", hook_injection)

# 3. Replace dashboardData. with displayData.
split_idx = content.find("return (")
if split_idx != -1:
    header = content[:split_idx]
    jsx = content[split_idx:]
    
    replacements = [
        ("dashboardData.totalEmployees", "displayData.totalEmployees"),
        ("dashboardData.totalRecords", "displayData.totalRecords"),
        ("dashboardData.incompleteScans", "displayData.incompleteScans"),
        ("dashboardData.totalDepts", "displayData.totalDepts"),
        ("dashboardData.employeeStats", "displayData.employeeStats"),
        ("dashboardData.barChartData", "displayData.barChartData"),
        ("dashboardData.pieChartData", "displayData.pieChartData"),
        ("dashboardData.uniqueDates", "displayData.uniqueDates"),
        ("dashboardData.employees", "displayData.employees"),
        ("dashboardData?.records", "displayData?.records"),
        ("if (selectedEmpId && dashboardData)", "if (selectedEmpId && displayData)"),
    ]
    for old, new in replacements:
        jsx = jsx.replace(old, new)
        header = header.replace(old, new)
        
    content = header + jsx

# 4. Inject Date Picker UI
ui_injection = """            {/* File Info & Date Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 py-2 px-4 rounded-lg w-full md:w-auto">
                <Layers className="text-blue-500 w-5 h-5" />
                <span>ดึงข้อมูลล่าสุด: <strong className="text-slate-900">{fileName}</strong></span>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <CalendarDays className="text-indigo-500 w-5 h-5" />
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">ช่วงวันที่:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {(startDate || endDate) && (
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:text-red-700 underline whitespace-nowrap">ล้างค่า</button>
                )}
              </div>
            </div>"""

content = content.replace("""            {/* File Info */}
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 py-3 px-5 rounded-xl">
              <Layers className="text-blue-500 w-5 h-5" />
              <span>ดึงข้อมูลล่าสุด: <strong className="text-slate-900">{fileName}</strong></span>
            </div>""", ui_injection)

with open(r'D:\empeo data\empeo3\empeo-dashboardnpx\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
