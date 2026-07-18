import os
import glob
import base64
import json
import urllib.request
import urllib.error
import subprocess
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    # อ่านจาก .env ก่อนเพื่อไม่ให้ติด push protection
    print("กรุณาใส่ GITHUB_TOKEN ในไฟล์ .env")
    exit(1)
GIST_ID_FILE = "gist_id.txt"

print("1. กำลังสั่งให้บอท (empeo.py) ดึงข้อมูลล่าสุด...")
try:
    subprocess.run(["python", r"D:\empeo data\empeo.py"], check=True)
except subprocess.CalledProcessError:
    print("เกิดข้อผิดพลาดในการรัน empeo.py")
    exit(1)

print("2. ค้นหาไฟล์ Excel ล่าสุดในโฟลเดอร์ Downloads...")
download_dir = os.path.expanduser(r"~\Downloads")
excel_files = glob.glob(os.path.join(download_dir, "Attendance_Report_*.xlsx"))
if not excel_files:
    print("ไม่พบไฟล์ Excel ในโฟลเดอร์ Downloads!")
    exit(1)

latest_file = max(excel_files, key=os.path.getmtime)
filename = os.path.basename(latest_file)
print(f"พบไฟล์: {filename}")

print("3. เข้ารหัสไฟล์เป็น Base64 เพื่อส่งขึ้น Cloud...")
with open(latest_file, "rb") as f:
    b64_content = base64.b64encode(f.read()).decode("utf-8")

gist_id = None
if os.path.exists(GIST_ID_FILE):
    with open(GIST_ID_FILE, "r") as f:
        gist_id = f.read().strip()

url = "https://api.github.com/gists"
method = "POST"
if gist_id:
    url = f"https://api.github.com/gists/{gist_id}"
    method = "PATCH"

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
}

data = {
    "description": "Empeo Dashboard Data Backup",
    "public": False,
    "files": {
        "data.b64": {
            "content": b64_content
        }
    }
}

print("4. กำลังอัปโหลดข้อมูลไปยัง GitHub Gist...")
req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method=method)
try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        new_gist_id = res_data["id"]
        
        if not gist_id:
            with open(GIST_ID_FILE, "w") as f:
                f.write(new_gist_id)
            print(f"สร้าง Database ใหม่สำเร็จ! Gist ID: {new_gist_id}")
        else:
            print(f"อัปเดต Database สำเร็จ! Gist ID: {new_gist_id}")
            
        with open(".env.local", "w") as f:
            f.write(f"NEXT_PUBLIC_GIST_ID={new_gist_id}\n")
            
        print("\n=== เสร็จสมบูรณ์! ===")
        print(f"NEXT_PUBLIC_GIST_ID ของคุณคือ: {new_gist_id}")
        print("นำค่ายี้ไปใส่ใน Environment Variables ของ Vercel ได้เลยครับ!")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.read().decode('utf-8')}")
