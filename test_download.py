import os
import time
import glob
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
    download_dir = os.path.join(os.getcwd(), "test_downloads")
    os.makedirs(download_dir, exist_ok=True)
    
    # clear old files
    for f in glob.glob(os.path.join(download_dir, "*.xlsx")):
        os.remove(f)

    options = Options()
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--headless=new")
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
        driver.get("https://login.gofive.co.th/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Did_token%2520token%26client_id%3DIMC%26state%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1;%25252F%26redirect_uri%3Dhttps%253A%252F%252Fapp.empeo.com%252F%26scope%3Dopenid%2520profile%2520offline_access%2520IMC.API%2520Venio2.API%2520GOFIVE.API%2520ClientPortal.API%26nonce%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1%26invitation_code%3Dapp") 
        wait.until(EC.presence_of_element_located((By.ID, "Email"))).send_keys("ssanetwork.se5@gmail.com")
        driver.find_element(By.ID, "Password").send_keys("Benz23071")
        driver.find_element(By.ID, "byEmail").click()
        time.sleep(5)
        driver.get("https://app.empeo.com/report/C009")
        time.sleep(8)
        
        # Set date
        date_to_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@data-testid='input_dateForm_dateTo']")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_to_input)
        time.sleep(1)
        ActionChains(driver).move_to_element(date_to_input).click().perform()
        time.sleep(2)
        
        date_to_input.send_keys(Keys.CONTROL + "a")
        date_to_input.send_keys(Keys.BACKSPACE)
        time.sleep(1)
        
        date_to_input.send_keys("01/06/2026")
        time.sleep(0.5)
        date_to_input.send_keys("30/06/2026")
        time.sleep(1)
        
        save_btn = driver.find_element(By.XPATH, "//button[contains(normalize-space(), 'บันทึก')]")
        driver.execute_script("arguments[0].click();", save_btn)
        time.sleep(2)
        # Click organization
        org_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, "//go5-dropdown-tree-multi[@data-testid='input_dropdown_org']")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", org_dropdown)
        time.sleep(1)
        try:
            ActionChains(driver).move_to_element(org_dropdown).click().perform()
        except:
            driver.execute_script("arguments[0].click();", org_dropdown)
        time.sleep(3)
        
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
        except:
            print("ไม่พบ เลือกทั้งหมด")
            pass

        # Click show
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
        
        print("Clicked show")
        time.sleep(10)
        
        driver.save_screenshot("test_after_show.png")
        print("Saved test_after_show.png")
        
        # Click download
        dl_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@data-testid='button_button_download']")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", dl_btn)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", dl_btn)
        time.sleep(3)
        driver.save_screenshot("test_download_dropdown.png")
        print("Saved test_download_dropdown.png")
        time.sleep(10)

        



        
    finally:
        driver.quit()
        
    excel_files = glob.glob(os.path.join(download_dir, "*.xlsx"))
    if excel_files:
        print(f"Downloaded: {excel_files[0]}")
    else:
        print("No file downloaded!")

if __name__ == "__main__":
    main()
