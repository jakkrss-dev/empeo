# Empeo Dashboard - System Workflow Diagram

```mermaid
graph TD
    A[ผู้ใช้กดอัพเดทข้อมูล] --> B[Vercel ส่ง API ไปยัง GitHub]
    B --> C[GitHub รัน Script Python]
    C --> D[ได้ไฟล์ Excel และส่งไปยัง Cloud]
    D --> A
```
