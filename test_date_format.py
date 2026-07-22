import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

options = Options()
options.add_argument("--window-size=1920,1080")
options.add_argument("--headless=new")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 20)

driver.get("https://login.gofive.co.th/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Did_token%2520token%26client_id%3DIMC%26state%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1;%25252F%26redirect_uri%3Dhttps%253A%252F%252Fapp.empeo.com%252F%26scope%3Dopenid%2520profile%2520offline_access%2520IMC.API%2520Venio2.API%2520GOFIVE.API%2520ClientPortal.API%26nonce%3DZGtDMnpyc3lkSDF5UU9MZjZTZHRWNzIybzU4azhTcnl1MzJRcTAuOThqNlM1%26invitation_code%3Dapp") 
wait.until(EC.presence_of_element_located((By.ID, "Email"))).send_keys("ssanetwork.se5@gmail.com")
driver.find_element(By.ID, "Password").send_keys("Benz23071")
driver.find_element(By.ID, "byEmail").click()
time.sleep(5)
driver.get("https://app.empeo.com/report/C009")
time.sleep(8)

date_to_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@data-testid='input_dateForm_dateTo']")))
driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_to_input)
time.sleep(1)
ActionChains(driver).move_to_element(date_to_input).click().perform()
time.sleep(2)

# Clear with keyboard
date_to_input.send_keys(Keys.CONTROL + "a")
date_to_input.send_keys(Keys.BACKSPACE)
time.sleep(1)

# In this test, let's type 01/05/2026 to 09/05/2026
date_to_input.send_keys("01/05/2026")
time.sleep(0.5)
date_to_input.send_keys("09/05/2026")
time.sleep(1)

# Click outside or save
save_btn = driver.find_element(By.XPATH, "//button[contains(normalize-space(), 'บันทึก') or contains(@class, 'save')]")
driver.execute_script("arguments[0].click();", save_btn)
time.sleep(2)

driver.save_screenshot("test_date_after_save.png")
print("Saved test_date_after_save.png")

driver.quit()
