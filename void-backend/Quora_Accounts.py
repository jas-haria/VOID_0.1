from bs4 import BeautifulSoup
import urllib.request
import re
import json
import pandas as pd

from selenium import webdriver
import time

from selenium.webdriver.common.by import By

df1=pd.DataFrame(columns=['URL'])
df2=pd.DataFrame(columns=['URL'])
temp_url = pd.DataFrame(columns=['URL'], index=range(1))
driver = webdriver.Chrome(r"C:\Users\Dell\PycharmProjects\Dasboard_v1.0\venv\Drivers\chromedriver.exe")
url = "https://www.quora.com/profile/Shruti-Karnik-4/answers"
driver.get(url)

driver.maximize_window()


SCROLL_PAUSE_TIME = 3

# Get scroll height
last_height = driver.execute_script("return document.body.scrollHeight")

while True:
    # Scroll down to bottom
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

    # Wait to load page
    time.sleep(SCROLL_PAUSE_TIME)

    # Calculate new scroll height and compare with last scroll height
    new_height = driver.execute_script("return document.body.scrollHeight")
    if new_height == last_height:
        break
    last_height = new_height

html = driver.page_source
x = BeautifulSoup(html,'html.parser')
z = 0

df_questions = pd.DataFrame(columns = ['URL'])
temp_url['URL'] = pd.DataFrame(columns = ['URL'], index = range(1))

for i in x.findAll('a', attrs={'class':'question_link'}):
    if i.find_parent('div').has_attr('class'):
        if i.find_parent('div')['class'] == "OriginallyAnsweredBanner":
            do_nothing =1
    else :
        temp_url['URL'] = ('https://www.quora.com'+i['href'])
        df_questions = df_questions.append(temp_url)

df_questions.reset_index(drop = True, inplace = True)
print(df_questions)
