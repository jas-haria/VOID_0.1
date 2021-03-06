from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
#from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from webdriver_manager.chrome import ChromeDriverManager
from dateutil.relativedelta import relativedelta
from datetime import datetime

from model.enum import TimePeriod
import config


engine = create_engine(config.db_server_name + '://' + config.db_username + ':' + config.db_password + '@'
                           + config.db_hostname + '/' + config.db_schema_name + '?charset=' + config.db_charset)
engine.connect()

def get_new_session():
    Session = sessionmaker(bind=engine)
    return Session()

def get_driver():
    options = Options()
    options.add_argument("--headless")
    driver = webdriver.Chrome(ChromeDriverManager().install(), options=options)
    #driver = webdriver.Chrome(r"C:/Users/jasha/.wdm/drivers/chromedriver/win32/86.0.4240.22/chromedriver.exe", options=options)

    #driver = webdriver.Remote(command_executor='http://192.168.225.107:4444/wd/hub',
    #                        desired_capabilities=DesiredCapabilities.CHROME, options=options)
    # driver.get('https://www.google.com')
    # time.sleep(3)
    # print(driver.page_source)
    return driver

def scroll_to_bottom(driver, SCROLL_PAUSE_TIME):
    reconfirmation_iteration = False
    # Get scroll height
    last_height = driver.execute_script("return document.body.scrollHeight")

    while True:
        # Scroll down to bottom
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        # Wait to load page
        time.sleep(SCROLL_PAUSE_TIME)
        if reconfirmation_iteration is True:
            time.sleep(SCROLL_PAUSE_TIME*2)
        # Calculate new scroll height
        new_height = driver.execute_script("return document.body.scrollHeight")
        # Check if second time height is constant
        if reconfirmation_iteration is True and new_height == last_height:
            break
        # Check if first time height is constant
        if new_height == last_height:
            reconfirmation_iteration = True
        else:
            reconfirmation_iteration = False
        last_height = new_height

def convert_list_to_json(list):
    json_list = []
    for item in list:
        if item is not None:
            json_list.append(item._asdict())
    return json_list

def convert_question_count_array_to_json(array):
    json = []
    for item in array:
        json.append({'date': str(item[1]), 'count': item[0]})
    return json

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

def get_number_from_string(num):
    num = replace_all(num, {',': ''})
    if 'K' in num:
        num = num[0: num.index('K')]
        num = float(num)*1000
    elif 'k' in num:
        num = num[0: num.index('k')]
        num = float(num)*1000
    elif 'M' in num:
        num = num[0: num.index('M')]
        num = float(num)*1000000
    elif 'm' in num:
        num = num[0: num.index('m')]
        num = float(num)*1000000

    return float(num)

def get_time_interval(time, value):
    timedelta_value = None
    if time == TimePeriod.DAY.value:
        timedelta_value = relativedelta(days=value)

    if time == TimePeriod.WEEK.value:
        timedelta_value = relativedelta(weeks=value)

    if time == TimePeriod.MONTH.value:
        timedelta_value = relativedelta(months=value)

    # RETURNING AN EXTRA DAY IN CASE OF OVERLAPPING TIMEZONES
    return datetime.now() - timedelta_value - relativedelta(days=1)
