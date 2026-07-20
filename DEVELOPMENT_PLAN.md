# Empeo Dashboard - 4 Weeks Development Plan

```mermaid
gantt
    title แผนการพัฒนาโปรเจกต์ (Development Phase - 4 Weeks)
    dateFormat  YYYY-MM-DD
    axisFormat  W%W
    
    section Week 1: โครงสร้างระบบ
    ออกแบบ System Architecture & Workflow       :a1, 2026-07-20, 3d
    จัดเตรียมโปรเจกต์ Next.js และ GitHub Repo    :a2, after a1, 2d
    ตั้งค่า Environment Variables และ Tokens     :a3, after a2, 2d
    
    section Week 2: พัฒนาบอท (Python)
    เขียนโค้ด Selenium สำหรับล็อกอินเข้าเว็บ Empeo :b1, 2026-07-27, 3d
    เขียนโค้ดและลอจิกดึงรายงาน (C009)          :b2, after b1, 2d
    ปรับแต่งการทำงานของบอทในรูปแบบ Headless Mode :b3, after b2, 2d
    
    section Week 3: พัฒนา Cloud API
    เขียนโค้ดแปลงไฟล์ Excel เป็นรหัส Base64      :c1, 2026-08-03, 2d
    พัฒนาโค้ด API อัปโหลดข้อมูลลง GitHub Gist   :c2, after c1, 3d
    พัฒนา Vercel API สั่งรัน GitHub Actions      :c3, after c2, 2d
    
    section Week 4: พัฒนา Frontend UI
    เขียนลอจิก JavaScript ดึงและประมวลผลข้อมูล     :d1, 2026-08-10, 3d
    สร้าง UI Dashboard (Next.js) ให้รองรับข้อมูล  :d2, after d1, 2d
    พัฒนากราฟสถิติและตารางข้อมูลด้วย Recharts      :d3, after d2, 2d
```
