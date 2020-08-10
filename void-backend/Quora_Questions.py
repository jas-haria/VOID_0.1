from bs4 import BeautifulSoup as bs
# import requests
from selenium import webdriver
import time

url = "https://www.quora.com/search?q=iit%20jee&time=week&type=question"
driver = webdriver.Chrome(r"C:\Users\jasha\PycharmProjects\void\driver\chromedriver.exe")
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

page = driver.page_source
soup = bs(page, 'html.parser')

for link in soup.findAll('a', attrs={'class': 'question_link'}):
    print('https://www.quora.com' + link['href'])

for span in soup.findAll('span', attrs={'class': 'ui_qtext_rendered_qtext'}):
    print(span.text)

url1 = 'https://www.quora.com/What-is-the-pattern-of-the-IIT-JEE-in-2020/log'
driver.get(url1)
page1 = driver.page_source
soup1 = bs(page1, 'html.parser')
for EachPart in soup1.select('div[class*="pagedlist_item"]'):
    if EachPart.get_text().find("Question added by") >= 0:
        print(EachPart.get_text()[-12:].lstrip())

driver.close()