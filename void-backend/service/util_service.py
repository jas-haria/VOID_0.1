from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import io
import pandas


def get_new_session():
    engine = create_engine("mysql://root:rootroot@localhost/VOID_DEV")
    engine.connect()
    Session = sessionmaker(bind=engine)
    return Session()

def get_driver():
    print("get driver")
    options = Options()
    options.add_argument("--headless")
    #return webdriver.Chrome(r"C:\Users\jasha\PycharmProjects\void\driver\chromedriver.exe", options=options)
    driver = webdriver.Chrome(ChromeDriverManager().install(), options=options)
    return driver

def scroll_to_bottom(driver, SCROLL_PAUSE_TIME):
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

def convert_list_to_json(list):
    json_list = []
    for item in list:
        if item is not None:
            json_list.append(item._asdict())
    return json_list

def paginate(query, page_number, page_limit):
    length = query.count()
    if page_number > 0:
        query = query.offset((page_number)*page_limit)
    query = query.limit(page_limit)
    return length, query

def replace_all(text, dict):
    for i, j in dict.items():
        text = text.replace(i, j)
    return text

def generate_excel(dataframe):
    strIO = io.BytesIO()
    excel_writer = pandas.ExcelWriter(strIO, engine="xlsxwriter")
    dataframe.to_excel(excel_writer, sheet_name="sheet 1")
    excel_writer.save()
    strIO.seek(0)
    return strIO