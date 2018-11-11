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
driver\
    .find_element_by_xpath("/html/body/my-app/clr-main-container/div/div/ng-component/div/div/div[2]/table/tbody/tr/td[2]/button")\
    .click()

time.sleep(1)

searchBar = driver.find_element_by_xpath('//*[@id="searchBar"]')
searchBar.send_keys("0x18e5024bB30ADf291b5dF683Dda577f9efF5e3Fc")

time.sleep(1)

driver.find_element_by_xpath('//*[@id="search-table"]/tbody/tr/td[4]/button').click()

time.sleep(3)

# driver.close()
