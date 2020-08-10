#LAST MODIFIED ON : 8/04/2020

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time

#INITIALIZE DRIVER AND GO TO URL
driver = webdriver.Chrome(r"C:\Users\Dell\PycharmProjects\Dasboard_v1.0\venv\Drivers\chromedriver.exe")
url="https://www.quora.com/"
driver.get(url)

#LOGIN TO ACCOUNT

"""Side Note: Will need to create ID Password for all accounts"""

form = driver.find_element_by_class_name('regular_login')
username = form.find_element_by_name('email')
username.send_keys('Avinashchatorikar08@gmail.com')
password = form.find_element_by_name('password')
password.send_keys('Gatewizard@1991')
password.send_keys(Keys.RETURN)
time.sleep(3)

#GO TO REQUESTS PAGE
url1 = ("https://www.quora.com/answer/requests")
driver.get(url1)

#SCROLL PAGE
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

#CREATE SOUP FOR PAGE
html = driver.page_source
soup = BeautifulSoup(html,'html.parser')

#GET REQUESTED QUESTIONS
for i in soup.findAll('a', attrs={'class':'question_link'}):
    questions = "https://www.quora.com/" + i.get('href')
    print(questions)