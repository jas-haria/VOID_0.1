from bs4 import BeautifulSoup as bs
import requests
from selenium import webdriver
import time
import pandas as pd

vidyalankar=['vidyalankar','vit+mumbai','vidyalankar+college','vidyalankar+classes','vidyalankar+institute+of+technology']
Science=['iit+jee','jee','iit','jee+mains','jee+advanced','iit jee classes mumbai','iit jee classes mumbai','best iit jee classes mumbai','mhtcet+exam','mht+cet','mht+cet+preparation','mh+cet','exam+mht+cet','mht cet classes mumbai','best mht cet classes mumbai',"neet",'neet classes mumbai','best neet classes mumbai',"bitsat","bitsat classes mumbai","best bitsat classes mumbai","bitsat preparatiom"]
engineering=['engineering+classes+in+mumbai','engineering+classes+mumbai','fe+classes+mumbai','se+classes+mumbai','te+classes+mumbai','mumbai+university+engineering','engineering+mumbai+university','engineering classes mumbai','best engineering classes mumbai']
bscit=['bscit+classes+in+mumbai','bscit+classes+mumbai','fy+bscit+classes+mumbai','sy+bscit+classes+mumbai','mumbai+university+bscit','bscit+mumbai+university','bscit classes mumbai','best bscit classes mumbai']
gate=['gate+exam','psus','gate classes mumbai','best gate classes mumbai']
array=[vidyalankar,Science,engineering,bscit,gate]
divisions=['Vidyalankar','Science','Engineering','Bsc-(IT)','GATE']
questions={}

tempQuestion=pd.DataFrame(columns=['Question'])
tempLink=pd.DataFrame(columns=['Link'])
tempDate=pd.DataFrame(columns=['Date'])
tempDivision=pd.DataFrame(columns=['Division'])
df=pd.DataFrame(columns=['Question','Link','Date','Division'],index=range(1))

d=0
count=-1
for i in array:
    count+=1
    for j in i:
        url="https://www.quora.com/search?q="+j+"&time=week&type=question"
        driver = webdriver.Chrome(r"C:\Users\Dell\PycharmProjects\Dasboard_v1.0\venv\Drivers\chromedriver.exe")
        driver.get(url)

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

        page=driver.page_source
        soup=bs(page,'html.parser')

#GET EACH QUESTION LINK & QUESTION TEXT
        for link in soup.findAll('a', attrs={'class':'question_link'}):
            questionLink='https://www.quora.com'+link['href']
            linkText = link.find('span', attrs={'class': 'ui_qtext_rendered_qtext'})

#GO TO LOG PAGE
            dateLink = questionLink + '/log'
            datePage = driver.page_source
            dateSoup = bs(datePage, 'html.parser')
            driver.get(dateLink)

#SCROLL LOG PAGE
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

#GET DATE
            for EachPart in dateSoup.select('div[class*="pagedlist_item"]'):
                if EachPart.get_text().find("Question added by") >= 0:
                    df.loc[d, 'Date']=(EachPart.get_text()[-12:].lstrip())

#ADD TO DF
            df.loc[d, 'Question'] = (linkText.text)
            df.loc[d, 'Link'] = (questionLink)
            df.loc[d, 'Division'] = (divisions[count])
#COUNT FOR DF
            d += 1

        print(df)
        driver.close()