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
        driver.get("https://login.gofive.co.th/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Did_token%2520token%26client_id%3DIMC%26state%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1;%25252F%26redirect_uri%3Dhttps%253A%252F%252Fapp.empeo.com%252F%26scope%3Dopenid%2520profile%2520offline_access%2520IMC.API%2520Venio2.API%2520GOFIVE.API%2520ClientPortal.API%26nonce%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1%26invitation_code%3Dapp") 
        
        wait.until(EC.presence_of_element_located((By.ID, "Email"))).send_keys("ssanetwork.se5@gmail.com")
        time.sleep(2)
        driver.find_element(By.ID, "Password").send_keys("Benz23071")
        driver.find_element(By.ID, "byEmail").click()
        
        time.sleep(8)
        driver.get("https://app.empeo.com/report/C009")
        time.sleep(8)
        
        inputs = driver.find_elements(By.TAG_NAME, "input")
        with open("debug_inputs.txt", "w", encoding="utf-8") as f:
            for inp in inputs:
                f.write(inp.get_attribute('outerHTML') + "\n")
        print("Saved debug_inputs.txt")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
