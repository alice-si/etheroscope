import time

from selenium import webdriver

try:
    driver = webdriver.Chrome()
except Exception:
    print('Download chromedriver.exe and put it in system path.')
    exit()

driver.get("localhost:8090")
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
