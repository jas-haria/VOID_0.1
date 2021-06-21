from sqlalchemy import asc, desc, and_
from bs4 import BeautifulSoup
from datetime import datetime
from dateutil.relativedelta import relativedelta
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException

import time
import re

from model.quora_model import Division, QuoraKeyword, QuoraQuestion, Script, QuoraAccount, ExecutionLog, \
    QuoraQuestionsArchieve, \
    QuoraQuestionAccountDetails, QuoraQuestionAccountActions, QuoraAccountStats, \
    QuoraQuestionArchieveAccountDetails, QuoraAskedQuestionArchieveStats
from model.enum import TimePeriod, QuoraQuestionAccountAction
from service.util_service import get_new_session, scroll_to_bottom, get_driver, replace_all, get_number_from_string, get_time_interval
import config


# METHOD TO GET NEW QUESTIONS
def refresh_data(time, put_todays_date):
    session = get_new_session()
    driver = get_driver()
    divisions = session.query(Division).order_by(asc(Division.id))
    keywords = session.query(QuoraKeyword).all()
    question_list = []
    parsed_question_urls = set()

    for divisionIndexer in divisions:
        for keywordIndexer in keywords:
            if keywordIndexer.division == divisionIndexer:
                url = "https://www.quora.com/search?q=" + replace_all(keywordIndexer.keyword, {" ": "+"}) + "&time=" + time + "&type=question"
                driver.get(url)
                scroll_to_bottom(driver, config.load_time)
                soup = BeautifulSoup(driver.page_source, 'html.parser')

                # GET EACH QUESTION LINK & QUESTION TEXT (REGEX CHECKS STARTING WITH / AND HAS MINIMUM 1 CHARACTER AFTER)
                for link in soup.findAll('a', attrs={'target': '_blank'}):
                    question_link = replace_all(link['href'], {"https://www.quora.com": ""})
                    # EXCLUDING URLS THAT ARE NOT QUESTIONS
                    if not is_question_url(question_link):
                        continue
                    # UNANSWERED QUESTIONS WILL REDIRECT TO ORIGINAL URL ANYWAY
                    question_link = replace_all(question_link, {'/unanswered/': '/'})
                    question_link = 'https://www.quora.com' + question_link
                    persisted_question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url.like(str(question_link))).first()
                    if persisted_question is None and question_link not in parsed_question_urls:
                        parsed_question_urls.add(question_link)
                        question = QuoraQuestion()
                        question.question_url = question_link.encode(config.encoding)
                        question.question_text = link.find('span').text.encode(config.encoding)
                        question.division_id = divisionIndexer.id
                        question_list.append(question)
    driver.quit()
    session.bulk_save_objects(fill_dates(question_list, put_todays_date, session))
    session.commit()
    session.close()
    return {}

def is_question_url(url):
    if url in ["/contact", "/"]:
        return False
    if any(substring in url for substring in ["/profile/", "/answer/", "/topic/"]):
        return False
    if url.startswith("/q/") and url.count("/") == 2:
        return False
    if not url.startswith("/"):
        return False
    return True

def fill_missing_dates():
    session = get_new_session()
    question_list = session.query(QuoraQuestion).filter_by(asked_on=None, disregard=False).all()

    session.bulk_save_objects(fill_dates(question_list, False, session))
    session.commit()
    session.close()
    return {}

def fill_dates(question_list, put_todays_date, session):
    if put_todays_date:
        fixed_asked_on = datetime.now().date()
        for question in question_list:
            question.asked_on = fixed_asked_on

    else:
        driver = get_driver()
        for question in question_list:
            link = question.question_url
            if type(link) != str:
                link = link.decode(config.encoding)
            link += '/log'

            driver.get(link)
            scroll_to_bottom(driver, config.load_time)
            soup = BeautifulSoup(driver.page_source, 'html.parser')

            # GET DATE
            for each_part in soup.select('div[class*="pagedlist_item"]'):
                if each_part.get_text().find("Question added by") >= 0:
                    date_text = each_part.get_text()
                    # FOR QUESTIONS ASKED LESS THAN 24 HOURS AGO
                    if 'ago' in date_text:
                        question.asked_on = datetime.now().date()
                        break
                    if 'yesterday' in date_text:
                        question.asked_on = (datetime.now() - relativedelta(days=1)).date()
                        break
                    # FOR QUESTIONS BEFORE
                    date_text = (date_text[-12:].strip())
                    if ',' in date_text:
                        question.asked_on = datetime.strptime(date_text, '%b %d, %Y').date()
                    else:
                        date_text = (date_text[-6:].strip())
                        question.asked_on = datetime.strptime(date_text, '%b %y').date()

        driver.quit()
    return question_list

# METHOD TO REFRESH QUESTIONS ANSWERED AND FOLLOWERS FOR EVERY ACCOUNT (WITHOUT LOGIN)
def refresh_accounts_data(capture_all = False):
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    answered_action = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ANSWERED).first()
    default_division = session.query(Division).filter(Division.division == 'Vidyalankar').first()
    driver = get_driver()
    for account in accounts:
        if account.link == 'unavailable':
            continue
        driver.get(account.link + '/answers')
        persisted_date = session.query(QuoraQuestion.asked_on).join(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.account_id == account.id,
            QuoraQuestionAccountDetails.action == answered_action)).order_by(desc(QuoraQuestion.asked_on)).first()
        if capture_all is True or persisted_date is None or len(persisted_date) == 0:
            scroll_to_bottom(driver, config.load_time)
        else:
            last_height = driver.execute_script("return document.body.scrollHeight")
            while True:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(config.load_time)
                dates = driver.find_elements_by_xpath("*//a[contains(@href, '/answer/" + account.link[account.link.rindex('/')+1: len(account.link)] + "')]")
                last_date_string = dates[-1].text
                try:
                    last_date = datetime.strptime(last_date_string.strip(), '%B %d, %Y')
                except ValueError:
                    try:
                        last_date = datetime.strptime(last_date_string.strip() + ', ' + str(datetime.now().year), '%B %d, %Y')
                        if last_date.date() > datetime.now().date():
                            last_date = last_date - relativedelta(years=1)
                    except ValueError:
                        last_date = None
                if last_date is not None and last_date.date() < persisted_date[0]:
                    break
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        for i in soup.findAll('a', attrs={"target": "_blank"}):
            link = replace_all(i.get('href'), {"https://www.quora.com": ""})
            if not is_question_url(link):
                continue
            question_url = "https://www.quora.com" + link
            question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url == question_url).first()
            if question is None:
                question = QuoraQuestion()
                question.question_url = question_url.encode(config.encoding)
                question.question_text = i.get_text().encode(config.encoding)
                question.asked_on = datetime.now().date()
                question.division = default_division
                session.add(question)
                qqad = None
            else:
                qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                    QuoraQuestionAccountDetails.account_id == account.id,
                    QuoraQuestionAccountDetails.question_id == question.id,
                    QuoraQuestionAccountDetails.action_id == answered_action.id)).first()
            if qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.account_id = account.id
                qqad.question = question
                qqad.action_id = answered_action.id
                session.add(qqad)
            archieved_question = session.query(QuoraQuestionsArchieve).filter(QuoraQuestionsArchieve.question_url == question_url).first()
            if archieved_question is None:
                archieved_question = QuoraQuestionsArchieve()
                archieved_question.question_url = question.question_url.encode(config.encoding)
                archieved_question.question_text = question.question_text.encode(config.encoding)
                session.add(archieved_question)
                qqaad = None
            else:
                qqaad = session.query(QuoraQuestionArchieveAccountDetails).filter(and_(
                    QuoraQuestionArchieveAccountDetails.account_id == account.id,
                    QuoraQuestionArchieveAccountDetails.question_id == archieved_question.id,
                    QuoraQuestionArchieveAccountDetails.action_id == answered_action.id)).first()
            if qqaad is None:
                qqaad = QuoraQuestionArchieveAccountDetails()
                qqaad.account_id = account.id
                qqaad.question = archieved_question
                qqaad.action_id = answered_action.id
                session.add(qqaad)
        # GET FOLLOWERS COUNT
        for i in soup.findAll('div'):
            if re.compile('^[0-9.,]+[mMkK]? Follower[s]?$').match(i.get_text()):
                follower_count = get_number_from_string(replace_all(i.get_text(), {"Follower": "", "s": ""}))
                follower_count_object = session.query(QuoraAccountStats).filter(and_(
                    QuoraAccountStats.recorded_on == datetime.now().date(),
                    QuoraAccountStats.account_id == account.id)).first()
                if follower_count_object is None:
                    follower_count_object = QuoraAccountStats()
                    follower_count_object.account = account
                    follower_count_object.recorded_on = datetime.now().date()
                follower_count_object.total_followers = follower_count
                session.add(follower_count_object)
                break
    driver.quit()
    session.commit()
    session.close()
    return {}

# METHOD TO LOG INTO QUORA ACCOUNT
def login_to_account(driver, account):
    driver.get("https://www.quora.com/")
    wait = WebDriverWait(driver, 3)
    username = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[contains(@placeholder, 'mail')]")))
    username.send_keys(account.email)
    password = driver.find_element_by_xpath("*//input[contains(@placeholder, 'assword')]")
    password.send_keys(account.password)
    password.send_keys(Keys.RETURN)
    time.sleep(config.load_time)
    return

# METHOD TO PASS SELECTED REQUESTED QUESTIONS
def pass_requested_questions():
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    passed_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.PASSED).first()
    requested_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.REQUESTED).first()
    for account in accounts:
        if account.link == 'unavailable':
            continue
        passed_questions = session.query(QuoraQuestion).join(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.account_id == account.id,
            QuoraQuestionAccountDetails.action == passed_action_object
        )).all()
        requested_questions_to_pass = session.query(QuoraQuestion).join(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.account_id == account.id,
            QuoraQuestionAccountDetails.action == requested_action_object,
            QuoraQuestion.asked_on < get_time_interval(TimePeriod.MONTH.value, 1).date()
        )).all()
        questions_to_pass = []
        for question in passed_questions:
            questions_to_pass.append(question)
        for question in requested_questions_to_pass:
            if question.id not in (q.id for q in questions_to_pass):
                questions_to_pass.append(question)
        if questions_to_pass == [] or len(questions_to_pass) == 0:
            continue
        driver = get_driver()
        login_to_account(driver, account)
        driver.get("https://www.quora.com/answer/requests")
        scroll_to_bottom(driver, config.load_time)
        passed_question_ids = []
        for question in questions_to_pass:
            link_without_domain = replace_all(question.question_url, {"https://www.quora.com": ""})
            try:
                link_element = driver.find_element_by_xpath("*//a[contains(@href, '" + question.question_url + "')]")
            except NoSuchElementException:
                try:
                    link_element = driver.find_element_by_xpath("*//a[contains(@href, '" + link_without_domain + "')]")
                except NoSuchElementException:
                    # IF QUESTION EXISTS BUT WAS NOT FOUND, IT'LL GET SCRAPED WITH REQUESTED QUESTIONS
                    continue
            estimated_parent_elements = 6
            while True:
                estimated_parent_elements -= 1
                try:
                    link_element = link_element.find_element_by_xpath("..")
                    pass_element = link_element.find_element_by_xpath("*//button[contains(., 'Pass')]")
                except NoSuchElementException:
                    #PASS BUTTON NOT FOUND
                    if estimated_parent_elements <= 0:
                        break
                    continue
                if pass_element is not None:
                    ActionChains(driver).move_to_element(pass_element).click(pass_element).perform()
                    passed_question_ids.append(question.id)
                    break
        session.query(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.question_id.in_(passed_question_ids),
            QuoraQuestionAccountDetails.action_id.in_([passed_action_object.id, requested_action_object.id]),
            QuoraQuestionAccountDetails.account_id == account.id)).delete(synchronize_session=False)
        driver.quit()
    session.commit()
    session.close()
    return {}

# METHOD TO SCRAPE REQUESTED QUESTIONS
def refresh_requested_questions():
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    default_division = session.query(Division).filter(Division.division == 'Vidyalankar').first()
    requested_action = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.REQUESTED).first()
    for account in accounts:
        if account.link == 'unavailable':
            continue
        driver = get_driver()
        login_to_account(driver, account)
        driver.get("https://www.quora.com/answer/requests")
        scroll_to_bottom(driver, config.load_time)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        # GET REQUESTED QUESTIONS
        for i in soup.findAll('a', attrs={'target': '_blank'}):
            link = replace_all(i.get('href'), {"https://www.quora.com": ""})
            if not is_question_url(link):
                continue
            question_url = ("https://www.quora.com" + replace_all(link, {'/unanswered/': '/'}))
            question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url == question_url).first()
            if question is None:
                question = QuoraQuestion()
                question.question_url = question_url.encode(config.encoding)
                question.question_text = i.get_text().encode(config.encoding)
                question.division = default_division
                question.asked_on = datetime.now().date()  # WE DONT HAVE DATE OF WHEN REQUEST WAS MADE, SO STORING LATEST DATE
                session.add(question)
                qqad = None
            else:
                if question.asked_on < get_time_interval(TimePeriod.MONTH.value, 1).date():
                    question.asked_on = datetime.now().date()  # WE DONT HAVE DATE OF WHEN REQUEST WAS MADE, SO STORING LATEST DATE
                qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                    QuoraQuestionAccountDetails.account_id == account.id,
                    QuoraQuestionAccountDetails.question_id == question.id,
                    QuoraQuestionAccountDetails.action_id == requested_action.id)).first()
            if qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.account_id = account.id
                qqad.question = question
                qqad.action_id = requested_action.id
                session.add(qqad)
        driver.quit()
    session.commit()
    session.close()
    return {}

# METHOD TO REFRESH ASKED QUESTIONS STATS
def refresh_asked_questions_stats():
    session = get_new_session()
    driver = get_driver()
    questions_details = session.query(QuoraQuestionArchieveAccountDetails).join(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASKED).all()

    for question_detail in questions_details:
        driver.get(question_detail.question.question_url)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        qaqas = session.query(QuoraAskedQuestionArchieveStats).filter(and_(
            QuoraAskedQuestionArchieveStats.question_id == question_detail.question_id,
            QuoraAskedQuestionArchieveStats.recorded_on == datetime.now().date())).first()
        if qaqas is None:
            qaqas = QuoraAskedQuestionArchieveStats()
            qaqas.question_id = question_detail.question_id
            qaqas.recorded_on = datetime.now().date()
            qaqas.answer_count = 0
            qaqas.follower_count = 0
            qaqas.view_count = 0
        # GET NUMBER OF ANSWERS (MAXES OUT AT 100, THEN DISPLAYS 100+)
        for i in soup.findAll('div'):
            if re.compile('^[0-9]+[+]? Answer[s]?$').match(i.get_text()):
                qaqas.answer_count = int(replace_all(i.get_text(), {'Answer': '', 's': '', ',': '', '+': ''}).strip())
                break
        driver.get(question_detail.question.question_url+'/log')
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        # IDENTIFIES STATS PER QUESTION
        for i in soup.findAll('div'):
            if re.compile('^[0-9.,]+[mMkK]? Public Follower[s]?$').match(i.get_text()):
                qaqas.follower_count = get_number_from_string(replace_all(i.get_text(), {'Public Follower': '', 's': ''}).strip())
            if re.compile('^[0-9.,]+[mMkK]? View[s]?$').match(i.get_text()):
                qaqas.view_count = get_number_from_string(replace_all(i.get_text(), {'View': '', 's': ''}).strip())
        session.add(qaqas)

    driver.quit()
    session.commit()
    session.close()
    return {}

# METHOD TO REFRESH ACCOUNT DATA FROM STATS PAGE
def refresh_accounts_stats():
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    for account in accounts:
        if account.link == 'unavailable' or account.id < 13:
            continue
        stats_page_array = [[0, 'Views', None], [1, 'Upvotes', None], [2, 'Shares', None]]
        driver = get_driver()
        login_to_account(driver, account)
        for i in stats_page_array:
            driver.get('https://quora.com/stats')
            time.sleep(config.load_time*3)
            menu_list = driver.find_elements_by_class_name("menu_link")[0]
            menu_list.click()
            last_week = driver.find_elements_by_name("1")[0]
            last_week.click()
            time.sleep(2)
            if i[0] == 0:
                i[2] = BeautifulSoup(driver.page_source, 'html.parser')
            else:
                next_stat_element = driver.find_elements_by_class_name("heads_up_item")[i[0]]
                next_stat_element.click()
                time.sleep(2)
                i[2] = BeautifulSoup(driver.page_source, 'html.parser')

        soup = stats_page_array[1][2]
        stats_count = []
        for i in soup.findAll("a", attrs={"heads_up_item"}):
            for j in soup.findAll("p", attrs={"big_num"}):
                stats_count.append(j.get_text(strip=True))
            break

        xaxis_dates = []
        stats_arrays_object = {}
        quora_account_stats_array = []
        for i in stats_page_array:
            soup = i[2]
            if get_number_from_string(stats_count[i[0]]) == float(0):
                continue
            if xaxis_dates.__len__() == 0:
                xaxis_dates = get_qas_xaxis_dates(soup)
                for date_object in xaxis_dates:
                    qas = QuoraAccountStats()
                    qas.recorded_on = date_object
                    qas.account = account
                    quora_account_stats_array.append(qas)

            stats_arrays_object[i[1]] = get_qas_graph_data(soup)

        count = 0
        for qas_element in quora_account_stats_array:
            if "Views" in stats_arrays_object and stats_arrays_object["Views"].__len__() > 0:
                qas_element.view_count = stats_arrays_object["Views"][count]
            if "Upvotes" in stats_arrays_object and stats_arrays_object["Upvotes"].__len__() > 0:
                qas_element.upvote_count = stats_arrays_object["Upvotes"][count]
            if "Shares" in stats_arrays_object and stats_arrays_object["Shares"].__len__() > 0:
                qas_element.share_count = stats_arrays_object["Shares"][count]
            saved_element = session.query(QuoraAccountStats).filter(QuoraAccountStats.account == qas_element.account).filter(QuoraAccountStats.recorded_on == qas_element.recorded_on).first()
            if saved_element is None:
                session.add(qas_element)
            else:
                if qas_element.view_count is not None:
                    saved_element.view_count = qas_element.view_count
                if qas_element.upvote_count is not None:
                    saved_element.upvote_count = qas_element.upvote_count
                if qas_element.share_count is not None:
                    saved_element.share_count = qas_element.share_count
            count = count + 1

        driver.quit()

    session.commit()
    session.close()
    return {}

# GET DATES ON XAXIS
def get_qas_xaxis_dates(soup):
    xaxis_dates = []
    xaxis_dates_tmp = []
    for i in soup.findAll('div', attrs={'class': 'x_tick plain'}):
        xaxis_date = datetime.strptime(i.get_text().strip(), '%b %d').date()
        if xaxis_date in xaxis_dates_tmp: #To check if the date got repeated
            for j in soup.findAll('div', attrs={'class': 'x_tick plain last_tick'}):
                xaxis_dates_tmp.append(datetime.strptime(j.get_text().strip(), '%b %d').date())
                for value in xaxis_dates_tmp:
                    # CONDITION IF NEW YEAR LIES IN BETWEEN WEEK
                    if value.month == 12 and datetime.now().month == 1:
                        year_value = datetime.now().year - 1
                    else:
                        year_value = datetime.now().year
                    xaxis_dates.append(datetime(year_value, value.month, value.day).date())
                break
            break
        xaxis_dates_tmp.append(xaxis_date)
    return xaxis_dates

# READ GRAPH DATA
def get_qas_graph_data(soup):
    selected_graph = None
    for i in soup.findAll('div', attrs={'class': 'stats_graph'}):
        if 'hidden' not in i['class']:
            selected_graph = i
            break
    # GET YAXIS VALUES AND HEIGHT FOR 1
    yaxis_values = []
    for i in selected_graph.findAll('g', attrs={'style': 'opacity: 1;'}):
        yaxis_value = {}
        yaxis_value['pixel'] = float(replace_all(i['transform'], {'translate(0,': '', ')': ''}))
        yaxis_value['number'] = get_number_from_string(i.get_text())
        if yaxis_values.__len__() == 2:
            break
        yaxis_values.append(yaxis_value)
    height_for_one = (yaxis_values[0]['pixel'] - yaxis_values[1]['pixel']) / (
                yaxis_values[1]['number'] - yaxis_values[0]['number'])
    #GET VALUES FOR EACH DATE
    values = []
    for i in selected_graph.findAll('div', attrs={'class': 'rickshaw_graph'}):
        for j in i.findAll('rect'):
            values.append(round(float(j['height']) / height_for_one))
        break
    return values

def delete_old_data():
    session = get_new_session()
    five_week_period = get_time_interval(TimePeriod.WEEK.value, 5)
    question_ids_query = session.query(QuoraQuestion.id).filter(QuoraQuestion.asked_on < five_week_period)
    question_ids_subquery = question_ids_query.subquery()
    session.query(QuoraAccountStats).filter(QuoraAccountStats.recorded_on < five_week_period).delete(synchronize_session=False)
    session.query(QuoraAskedQuestionArchieveStats).filter(QuoraAskedQuestionArchieveStats.recorded_on < five_week_period).delete(synchronize_session=False)
    session.query(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.question_id.in_(question_ids_subquery)).delete(synchronize_session=False)
    question_ids_count = question_ids_query.count()
    # NEED TO DELETE IN BATCHES AS ONLY 1000 RECORDS ARE RETURNED FROM SQL AT A TIME
    while question_ids_count > 0:
        if question_ids_count > 100:
            question_ids = question_ids_query.limit(100).all()
            question_ids_count = question_ids_count - 100
        else:
            question_ids = question_ids_query.limit(question_ids_count).all()
            question_ids_count = 0
        session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).delete(synchronize_session=False)

    session.commit()
    session.close()
    return {}

def refresh_all_stats():
    session = get_new_session()
    script = session.query(Script).filter(Script.name == 'Refresh_Quora_Stats').first()
    execution_log = session.query(ExecutionLog).filter(ExecutionLog.script_id == script.id).first()
    if execution_log is None:
        execution_log = ExecutionLog()
        execution_log.script_id = script.id

    if execution_log.execution_time is None or execution_log.execution_time < get_time_interval(TimePeriod.DAY.value, 1):
       refresh_data(TimePeriod.WEEK.value, True)
    else:
       refresh_data(TimePeriod.DAY.value, True)

    if execution_log.execution_time is None:
        refresh_accounts_data(True)
    else:
        refresh_accounts_data(False)

    pass_requested_questions()
    refresh_requested_questions()
    refresh_asked_questions_stats()
    refresh_accounts_stats()
    delete_old_data()
    session.execute("call " + config.db_schema_name + ".REFRESH_QUESTIONS_TABLE()")

    execution_log.execution_time = datetime.now()
    response = execution_log._asdict()
    session.add(execution_log)
    session.commit()
    session.close()
    return response

def test():
    session = get_new_session()
    script = session.query(Script).filter(Script.name == 'Refresh_Quora_Stats').first()
    execution_log = session.query(ExecutionLog).filter(ExecutionLog.script_id == script.id).first()
    response = execution_log._asdict()
    session.close()
    return {}