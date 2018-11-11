import time

from selenium import webdriver
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary

try:
    driver = webdriver.Firefox()
except Exception:
    print('Firefox driver not found in system path, will try with path form script.')
    try:
        binary = FirefoxBinary(r'C:\Program Files\Mozilla Firefox\firefox.exe')
        driver = webdriver.Firefox(firefox_binary=binary)
    except Exception:
        try:
            print('Firefox driver not found in path form script, will chromedriver.from system path.')
            driver = webdriver.Chrome()
        except Exception:
            print('Download chromedriver.exe and put in system path, or install Firefox.')
            exit()

driver.get("http://localhost:8090")
time.sleep(3)
driver.close()



