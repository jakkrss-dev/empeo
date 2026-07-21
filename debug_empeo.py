import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def main():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 20)
    
    try:
        print("Logging in...")
        driver.get("https://login.gofive.co.th/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Did_token%2520token%26client_id%3DIMC%26state%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1;%25252F%26redirect_uri%3Dhttps%253A%252F%252Fapp.empeo.com%252F%26scope%3Dopenid%2520profile%2520offline_access%2520IMC.API%2520Venio2.API%2520GOFIVE.API%2520ClientPortal.API%26nonce%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1%26invitation_code%3Dapp") 
        
        wait.until(EC.presence_of_element_located((By.ID, "Email"))).send_keys("ssanetwork.se5@gmail.com")
        time.sleep(2)
        driver.find_element(By.ID, "Password").send_keys("Benz23071")
        driver.find_element(By.ID, "byEmail").click()
        
        print("Waiting for login...")
        time.sleep(8)
        
        print("Navigating to C009...")
        driver.get("https://app.empeo.com/report/C009")
        time.sleep(8)
        
        driver.save_screenshot("debug_before_date.png")
        print("Saved debug_before_date.png")
        
        # Test JS injection
        try:
            date_from_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@data-testid='input_dateForm_dateFrom']")))
            driver.execute_script("arguments[0].value = '01/06/2026'; arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", date_from_input)
            date_to_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@data-testid='input_dateForm_dateTo']")))
            driver.execute_script("arguments[0].value = '30/06/2026'; arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", date_to_input)
            print("Injected dates via JS")
        except Exception as e:
            print(f"Error injecting dates: {e}")
            
        time.sleep(2)
        driver.save_screenshot("debug_after_date.png")
        print("Saved debug_after_date.png")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
