import time
from selenium import webdriver

try:
    driver = webdriver.Chrome()
except Exception:
    print('Download chromedriver.exe and put it in system path.')
    exit()

driver.get("localhost:8090")
time.sleep(3)
driver.close()
