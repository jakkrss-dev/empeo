import os
import glob
import time
import calendar
from datetime import datetime
import base64
import json
import urllib.request
import urllib.error
import argparse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, default="", help="Start date in YYYY-MM-DD format")
    parser.add_argument("--end-date", type=str, default="", help="End date in YYYY-MM-DD format")
    args = parser.parse_args()
    start_date = args.start_date
    end_date = args.end_date

    GITHUB_TOKEN = os.environ.get("GIST_GITHUB_TOKEN")
    if not GITHUB_TOKEN:
        print("Missing GIST_GITHUB_TOKEN environment variable")
        exit(1)
        
    GIST_ID = os.environ.get("NEXT_PUBLIC_GIST_ID")
    if not GIST_ID:
        GIST_ID = "f401dd8cadb19f27a486bf4615aa1677"

    print("กำลังเตรียมเบราว์เซอร์ (Headless Mode)...")
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    download_dir = os.path.join(os.getcwd(), "downloads")
    os.makedirs(download_dir, exist_ok=True)
    
    prefs = {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    }
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 20)
    
    try:
        print("กำลังเข้าสู่ระบบ empeo...")
        driver.get("https://login.gofive.co.th/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Did_token%2520token%26client_id%3DIMC%26state%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1;%25252F%26redirect_uri%3Dhttps%253A%252F%252Fapp.empeo.com%252F%26scope%3Dopenid%2520profile%2520offline_access%2520IMC.API%2520Venio2.API%2520GOFIVE.API%2520ClientPortal.API%26nonce%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1%26invitation_code%3Dapp") 
        
        wait.until(EC.presence_of_element_located((By.ID, "Email"))).send_keys("ssanetwork.se5@gmail.com")
        time.sleep(2)
        driver.find_element(By.ID, "Password").send_keys("Benz23071")
        driver.find_element(By.ID, "byEmail").click()
        
        print("รอเข้าสู่ระบบ...")
        time.sleep(8)
        
        print("กำลังไปยังหน้ารายงาน C009...")
        driver.get("https://app.empeo.com/report/C009")
        time.sleep(8) 
        
        if start_date and end_date:
            print(f"กำลังตั้งค่าตัวกรองข้อมูลช่วงเวลา: {start_date} ถึง {end_date}")
            try:
                # แปลง YYYY-MM-DD เป็น DD/MM/YYYY (ค.ศ. เป็น พ.ศ.)
                sy, sm, sd = start_date.split('-')
                ey, em, ed = end_date.split('-')
                
                date_from_str = f"{sd}/{sm}/{sy}"
                date_to_str = f"{ed}/{em}/{ey}"
                
                try:
                    date_to_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@data-testid='input_dateForm_dateTo']")))
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_to_input)
                    time.sleep(1)
                    
                    ActionChains(driver).move_to_element(date_to_input).click().perform()
                    time.sleep(2)
                    
                    driver.execute_script("arguments[0].value = '';", date_to_input)
                    date_to_input.send_keys(date_from_str)
                    time.sleep(0.5)
                    date_to_input.send_keys(date_to_str)
                    time.sleep(1)
                    
                    save_btn = driver.find_element(By.XPATH, "//button[contains(normalize-space(), 'บันทึก')]")
                    driver.execute_script("arguments[0].click();", save_btn)
                    time.sleep(1)
                    print(f"ตั้งค่าช่วงเวลาสำเร็จ: {date_from_str} - {date_to_str}")
                except Exception as e:
                    print(f"ไม่พบช่องเลือกช่วงเวลา หรือเกิดข้อผิดพลาด: {e}")
                    
                time.sleep(1)
            except Exception as e:
                print(f"รูปแบบวันที่ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการคำนวณวันที่: {e}")
        
        print("กำลังตั้งค่าตัวกรองข้อมูล 'สังกัด'...")
        try:
            org_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, "//go5-dropdown-tree-multi[@data-testid='input_dropdown_org']")))
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", org_dropdown)
            time.sleep(1)
            try:
                ActionChains(driver).move_to_element(org_dropdown).click().perform()
            except:
                driver.execute_script("arguments[0].click();", org_dropdown)
            time.sleep(3)
        except Exception as e:
            print(f"หาปุ่มเปิด Dropdown สังกัดไม่พบ: {e}")
            
        target_xpath = "//*[normalize-space()='เลือกทั้งหมด']"
        try:
            target_options = wait.until(EC.presence_of_all_elements_located((By.XPATH, target_xpath)))
            for option in target_options:
                try:
                    text_val = option.text.strip()
                    if text_val and option.is_displayed():
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", option)
                        time.sleep(0.5)
                        try:
                            ActionChains(driver).move_to_element(option).click().perform()
                        except:
                            driver.execute_script("arguments[0].click();", option)
                        time.sleep(0.5)
                        try:
                            parent = option.find_element(By.XPATH, "..")
                            driver.execute_script("arguments[0].click();", parent)
                        except:
                            pass
                        print(f"คลิกเลือกสังกัดสำเร็จ: {text_val}")
                        break
                except Exception:
                    continue
        except Exception as e:
            print("เกิดข้อผิดพลาดในการค้นหาตัวเลือกสังกัด")

        time.sleep(2)
        print("กำลังกดปุ่มแสดง...")
        try:
            time.sleep(3)
            try:
                show_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@data-testid='button_submit_button_button_show']")))
            except:
                show_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(normalize-space(), 'แสดง')]")))
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", show_btn)
            time.sleep(1)
            try:
                show_btn.click()
            except:
                driver.execute_script("arguments[0].click();", show_btn)
            time.sleep(8)
        except Exception as e:
            print(f"เกิดข้อผิดพลาดในการกดปุ่ม 'แสดง': {e}")
            raise e

        print("กำลังกดปุ่มดาวน์โหลด...")
        dl_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@data-testid='button_button_download']")))
        driver.execute_script("arguments[0].click();", dl_btn)
        
        print("รอไฟล์ดาวน์โหลด 15 วินาที...")
        time.sleep(15)
        
    except Exception as e:
        print(f"\nพบปัญหา: {e}")
        driver.quit()
        exit(1)
    finally:
        driver.quit()
        
    print("กำลังค้นหาไฟล์ Excel ล่าสุดในโฟลเดอร์ downloads...")
    excel_files = glob.glob(os.path.join(download_dir, "Attendance_Report_*.xlsx"))
    if not excel_files:
        print("ไม่พบไฟล์ Excel!")
        exit(1)
        
    latest_file = max(excel_files, key=os.path.getmtime)
    print(f"พบไฟล์: {os.path.basename(latest_file)}")
    
    print("กำลังอัปโหลดขึ้น GitHub Gist...")
    with open(latest_file, "rb") as f:
        b64_content = base64.b64encode(f.read()).decode("utf-8")
        
    url = f"https://api.github.com/gists/{GIST_ID}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }
    data = {
        "files": {
            "data.b64": {
                "content": b64_content
            }
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req) as response:
            print(f"อัปเดต Database สำเร็จ! Gist ID: {GIST_ID}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.read().decode('utf-8')}")
        exit(1)

if __name__ == "__main__":
    main()
