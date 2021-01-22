from sqlalchemy import asc, desc, func, and_
from bs4 import BeautifulSoup
from datetime import datetime
from dateutil.relativedelta import relativedelta
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException

import time
import io
import re
import pandas

from model.quora_model import Division, QuoraKeyword, QuoraQuestion, Script, QuoraAccount, ExecutionLog, \
    QuoraQuestionAccountDetails, QuoraQuestionAccountActions, QuoraAccountStats, QuoraAskedQuestionStats
from model.enum import TimePeriod, QuoraQuestionAccountAction
from service.util_service import get_new_session, scroll_to_bottom, get_driver, paginate, replace_all, convert_list_to_json, get_number_from_string, get_time_interval

LOAD_TIME = 3
encoding = 'utf-8'
quora_asked_question_excel_headers = ['Question Url', 'Question Text', 'Division', 'Account', 'Asked On'];


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
                scroll_to_bottom(driver, LOAD_TIME)
                soup = BeautifulSoup(driver.page_source, 'html.parser')

                # GET EACH QUESTION LINK & QUESTION TEXT (REGEX CHECKS STARTING WITH / AND HAS MINIMUM 1 CHARACTER AFTER)
                for link in soup.findAll('a', attrs={'target': '_blank'}):
                    question_link = link['href']
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
                        question.question_url = question_link.encode(encoding)
                        question.question_text = link.find('span').text.encode(encoding)
                        question.division_id = divisionIndexer.id
                        question_list.append(question)
    driver.quit()
    session.bulk_save_objects(fill_dates(question_list, put_todays_date, session))
    session.commit()

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

#can be deleted, missing dates should be replaced by current date
def fill_missing_dates():
    session = get_new_session()
    question_list = session.query(QuoraQuestion).filter_by(asked_on=None, disregard=False).all()

    session.bulk_save_objects(fill_dates(question_list, False, session))
    session.commit()

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
                link = link.decode(encoding)
            link += '/log'

            driver.get(link)
            scroll_to_bottom(driver, LOAD_TIME)
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

def disregard_questions(question_ids_list):
    session = get_new_session()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids_list)).all()
    for question in questions:
        question.disregard = True
        session.add(question)
    session.commit()
    return {}

def update_qqad(question_ids_list, action, account_id):
    session = get_new_session()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids_list)).all()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    if action_object is not None:
        for question in questions:
            qqad = QuoraQuestionAccountDetails()
            qqad.question_id = question.id
            qqad.account_id = account_id
            qqad.action = action_object
            session.add(qqad)
    session.commit()
    return {}

def delete_qqad(question_ids_list, action, account_id):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    session.query(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.question_id.in_(question_ids_list)).filter(QuoraQuestionAccountDetails.account_id == account_id)\
        .filter(QuoraQuestionAccountDetails.action == action_object).delete(synchronize_session=False)
    session.commit()
    return {}

def add_pass_qqad(question_ids_list, account_id):
    if account_id is not None:
        update_qqad(question_ids_list, QuoraQuestionAccountAction.PASSED.__str__(), account_id)
    else:
        session = get_new_session()
        passed_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.PASSED).first()
        requested_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.REQUESTED).first()
        requested_qqads = session.query(QuoraQuestionAccountDetails).join(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids_list)) \
            .filter(QuoraQuestionAccountDetails.action == requested_action_object).all()
        for requested_qqad in requested_qqads:
            qqad = QuoraQuestionAccountDetails()
            qqad.question_id = requested_qqad.question_id
            qqad.account_id = requested_qqad.account_id
            qqad.action = passed_action_object
            session.add(qqad)
        session.commit()
    return {}

def get_questions(division_ids, time, page_number, page_size, action, account_id):
    session = get_new_session()
    if action == QuoraQuestionAccountAction.NEW.__str__():
        query = session.query(QuoraQuestion).filter(and_(QuoraQuestion.division_id.in_(division_ids)),
                                                    QuoraQuestion.asked_on > get_time_interval(time),
                                                    (QuoraQuestion.disregard).is_(False),
                                                    ~QuoraQuestion.accounts.any()).order_by(desc(QuoraQuestion.id))
        length, paginated_query = paginate(query=query, page_number=int(page_number), page_limit=int(page_size))
        return {'totalLength': length, 'content': convert_list_to_json(paginated_query.all())}
    if action == QuoraQuestionAccountAction.REQUESTED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.ASSIGNED, QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    elif action == QuoraQuestionAccountAction.ASSIGNED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    elif action == QuoraQuestionAccountAction.ANSWERED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    else:
        actions_to_ignore = None
    query = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestion).join(
        QuoraQuestionAccountActions)
    if actions_to_ignore is not None:
        questions_to_ignore = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestionAccountActions).filter(
            QuoraQuestionAccountActions.action.in_(actions_to_ignore))
        if account_id is not None:
            questions_to_ignore = questions_to_ignore.filter(QuoraQuestionAccountDetails.account_id == account_id)
        questions_to_ignore = questions_to_ignore.subquery()
        query = query.filter(QuoraQuestion.id.notin_(questions_to_ignore))
    query = query.filter(and_(
        QuoraQuestion.division_id.in_(division_ids),
        QuoraQuestion.asked_on > get_time_interval(time),
        (QuoraQuestion.disregard).is_(False),
        QuoraQuestionAccountActions.action == action))
    if account_id is not None:
        query = query.filter(QuoraQuestionAccountDetails.account_id == account_id)
    length, paginated_query = paginate(query=query.order_by(desc(QuoraQuestion.id)), page_number=int(page_number), page_limit=int(page_size))
    question_ids = paginated_query.all()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).all()
    return {'totalLength': length, 'content': convert_list_to_json(questions)}

def get_asked_questions_stats(question_ids, last_week):
    session = get_new_session()
    stats = []
    if question_ids is None:
        question_ids = session.query(QuoraQuestion.id).filter(QuoraQuestion.asked_on > get_time_interval(TimePeriod.MONTH.value)).all()
    query = session.query(QuoraAskedQuestionStats)
    if last_week is True:
        query = query.filter(QuoraAskedQuestionStats.recorded_on < get_time_interval(TimePeriod.WEEK.value))
    for id in question_ids:
        question_stat = query.filter(QuoraAskedQuestionStats.question_id == id).order_by(desc(QuoraAskedQuestionStats.recorded_on)).first()
        stats.append(question_stat)
    return convert_list_to_json(stats)

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
        driver.get(account.link)
        persisted_date = session.query(QuoraQuestion.asked_on).join(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.account_id == account.id) \
            .filter(QuoraQuestionAccountDetails.question_id == QuoraQuestion.id).filter(QuoraQuestionAccountDetails.action ==answered_action).order_by(desc(QuoraQuestion.asked_on)).first()
        if capture_all is True or persisted_date is None or len(persisted_date) == 0:
            scroll_to_bottom(driver, LOAD_TIME)
        else:
            last_height = driver.execute_script("return document.body.scrollHeight")
            while True:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(LOAD_TIME)
                dates = driver.find_elements_by_xpath("*//a[contains(@href, '/answer/" + account.link[account.link.rindex('/')+1: len(account.link)] + "')]")
                last_date_string = dates[-1].text
                try:
                    last_date = datetime.strptime(last_date_string.strip(), '%B %d, %Y')
                except ValueError:
                    last_date = datetime.strptime(last_date_string.strip() + ', ' + str(datetime.now().year), '%B %d, %Y')
                    if last_date.date() > datetime.now().date():
                        last_date = last_date - relativedelta(years=1)
                if last_date.date() < persisted_date[0]:
                    break
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        for i in soup.findAll('a', attrs={"target": "_blank"}):
            link = i.get('href')
            if not is_question_url(link):
                continue
            question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url == link).first()
            if question is None:
                question = QuoraQuestion()
                question.question_url = link.encode(encoding)
                question.question_text = i.get_text().encode(encoding)
                question.asked_on = datetime.now().date()
                question.division = default_division
                session.add(question)
                qqad = QuoraQuestionAccountDetails()
            else:
                qqad = session.query(QuoraQuestionAccountDetails).filter(
                    QuoraQuestionAccountDetails.account == account).filter(
                    QuoraQuestionAccountDetails.question == question) \
                    .filter(QuoraQuestionAccountDetails.action == answered_action).first()
            if qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.account = account
                qqad.question = question
                qqad.action = answered_action
                session.add(qqad)
        # GET FOLLOWERS COUNT
        for i in soup.findAll('div'):
            if re.compile('^[0-9.,]+[mMkK]? Follower[s]?$').match(i.get_text()):
                follower_count = get_number_from_string(replace_all(i.get_text(), {"Follower": "", "s": ""}))
                follower_count_object = session.query(QuoraAccountStats).filter(
                    QuoraAccountStats.recorded_on == datetime.now().date()).filter(
                    QuoraAccountStats.account_id == account.id).first()
                if follower_count_object is None:
                    follower_count_object = QuoraAccountStats()
                    follower_count_object.account = account
                    follower_count_object.recorded_on = datetime.now().date()
                follower_count_object.total_followers = follower_count
                session.add(follower_count_object)
                break
    driver.quit()
    session.commit()
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
    time.sleep(LOAD_TIME)
    return

def pass_requested_questions():
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    passed_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.PASSED).first()
    requested_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.REQUESTED).first()
    for account in accounts:
        if account.link == 'unavailable':
            continue
        driver = get_driver()
        login_to_account(driver, account)
        driver.get("https://www.quora.com/answer/requests")
        scroll_to_bottom(driver, LOAD_TIME)
        questions_to_pass = session.query(QuoraQuestion).join(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.account_id == account.id)\
            .filter(QuoraQuestionAccountDetails.action == passed_action_object).all()
        if questions_to_pass is None:
            continue
        for question in questions_to_pass:
            link_in_quora = replace_all(question.question_url, {"https://www.quora.com": ""})
            try:
                link_element = driver.find_element_by_xpath("*//a[contains(@href, '" + link_in_quora + "')]")
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
                    pass_element.click()
                    break
        session.query(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.question_id.in_(q.id for q in questions_to_pass),
            QuoraQuestionAccountDetails.action_id.in_([passed_action_object.id, requested_action_object.id]),
            QuoraQuestionAccountDetails.account_id == account.id)).delete(synchronize_session=False)
        driver.quit()
        session.commit()
    return {}


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
        scroll_to_bottom(driver, LOAD_TIME)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        # GET REQUESTED QUESTIONS
        for i in soup.findAll('a', attrs={'target': '_blank'}):
            link = i.get('href')
            if not is_question_url(link):
                continue
            question_url = ("https://www.quora.com" + replace_all(link, {'/unanswered/': '/'}))
            question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url == question_url).first()
            if question is None:
                question = QuoraQuestion()
                question.question_url = question_url.encode(encoding)
                question.question_text = i.get_text().encode(encoding)
                session.add(question)
                question.division = default_division
            question.asked_on = datetime.now().date()  # WE DONT HAVE DATE OF WHEN REQUEST WAS MADE, SO STORING LATEST DATE
            qqad = session.query(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.account == account).filter(QuoraQuestionAccountDetails.question == question)\
                .filter(QuoraQuestionAccountDetails.action == requested_action).first()
            if qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.account = account
                qqad.question = question
                qqad.action = requested_action
                session.add(qqad)
        driver.quit()
    session.commit()
    return {}

def refresh_asked_questions_stats():
    session = get_new_session()
    driver = get_driver()
    questions_details = session.query(QuoraQuestionAccountDetails).join(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASKED).all()
    for question_detail in questions_details:
        driver.get(question_detail.question.question_url)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        qaqs = session.query(QuoraAskedQuestionStats).filter(QuoraAskedQuestionStats.question_id == question_detail.question_id).filter(QuoraAskedQuestionStats.recorded_on == datetime.now().date()).first()
        if qaqs is None:
            qaqs = QuoraAskedQuestionStats()
            qaqs.question_id = question_detail.question_id
            qaqs.recorded_on = datetime.now().date()
            qaqs.answer_count = 0
            qaqs.follower_count = 0
            qaqs.view_count = 0
        # GET NUMBER OF ANSWERS (MAXES OUT AT 100, THEN DISPLAYS 100+)
        for i in soup.findAll('div'):
            if re.compile('^[0-9]+[+]? Answer[s]?$').match(i.get_text()):
                qaqs.answer_count = int(replace_all(i.get_text(), {'Answer': '', 's': '', ',': '', '+': ''}).strip())
                break
        driver.get(question_detail.question.question_url+'/log')
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        # IDENTIFIES STATS PER QUESTION
        for i in soup.findAll('div'):
            if re.compile('^[0-9.,]+[mMkK]? Public Follower[s]?$').match(i.get_text()):
                qaqs.follower_count = get_number_from_string(replace_all(i.get_text(), {'Public Follower': '', 's': ''}).strip())
            if re.compile('^[0-9.,]+[mMkK]? View[s]?$').match(i.get_text()):
                qaqs.view_count = get_number_from_string(replace_all(i.get_text(), {'View': '', 's': ''}).strip())
        session.add(qaqs)
        break

    driver.quit()
    session.commit()
    return {}

def refresh_accounts_stats():
    session = get_new_session()
    accounts = session.query(QuoraAccount).all()
    for account in accounts:
        if account.link == 'unavailable':
            continue
        driver = get_driver()
        login_to_account(driver, account)
        driver.get('https://quora.com/stats')
        menu_list = driver.find_element_by_class_name("menu_link")
        menu_list.click()
        time.sleep(LOAD_TIME)
        last_week = driver.find_element_by_name("1")
        last_week.click()
        time.sleep(LOAD_TIME)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        stats_count = []
        for i in soup.findAll("a", attrs={"heads_up_item"}):
            for j in soup.findAll("p", attrs={"big_num"}):
                stats_count.append(j.get_text(strip=True))
            break

        xaxis_dates = []
        stats_arrays_object = {}
        quora_account_stats_array = []
        for i in [[0, 'Views'], [1, 'Upvotes'], [2, 'Shares']]:
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

            if i[0] < 2:
                next_stat_element = driver.find_elements_by_class_name("heads_up_item")[i[0]+1]
                next_stat_element.click()
                time.sleep(LOAD_TIME)
                soup = BeautifulSoup(driver.page_source, 'html.parser')

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

def generate_pending_questions_df_for_excel(account_id):
    session = get_new_session()
    data = []
    questions_to_ignore = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestionAccountActions).filter(
        QuoraQuestionAccountActions.action.in_([QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED])).all()
    question_ids = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestion).join(QuoraQuestionAccountActions).filter((QuoraQuestion.disregard).is_(False))\
        .filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASSIGNED).filter(QuoraQuestionAccountDetails.question_id.notin_(questions_to_ignore))\
        .filter(QuoraQuestionAccountDetails.account_id == account_id).all()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).order_by(desc(QuoraQuestion.id))
    for question in questions:
        data.append({'id': question.id, 'question': question.question_text, 'url': question.question_url, 'division': question.division.division, 'approx date asked': question.asked_on})
    dataframe = pandas.DataFrame(data)
    strIO = io.BytesIO()
    excel_writer = pandas.ExcelWriter(strIO, engine="xlsxwriter")
    dataframe.to_excel(excel_writer, sheet_name="sheet 1")
    excel_writer.save()
    strIO.seek(0)
    return strIO

def get_accounts(id):
    session = get_new_session()
    if id is None:
        accounts = session.query(QuoraAccount).order_by(asc(QuoraAccount.id)).all()
        response = convert_list_to_json(accounts)
    else:
        account = session.query(QuoraAccount).filter(QuoraAccount.id == id).first()
        response = account._asdict()
    return response

def get_quora_accounts_stats(account_id):
    session = get_new_session()
    query = session.query(QuoraAccountStats)
    if account_id is not None:
        query = query.filter(QuoraAccountStats.account_id == account_id)
    stats = query.filter(QuoraQuestion.asked_on > get_time_interval(TimePeriod.MONTH.value)).all()
    return convert_list_to_json(stats)

def get_quora_questions_count(action, account_id):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    query = session.query(func.count(QuoraQuestionAccountDetails.question_id), QuoraQuestion.asked_on).join(QuoraQuestion).filter(QuoraQuestion.disregard.is_(False))
    if account_id is not None:
        query = query.filter(QuoraQuestionAccountDetails.account_id == account_id)
    details = query.filter(QuoraQuestionAccountDetails.action == action_object).filter(QuoraQuestion.asked_on > get_time_interval(TimePeriod.MONTH.value))\
        .group_by(QuoraQuestion.asked_on).all()
    return convert_question_count_array_to_json(details)

def convert_question_count_array_to_json(array):
    json = []
    for item in array:
        json.append({'date': str(item[1]), 'count': item[0]})
    return json

def get_asked_questions_sample_excel():
    session = get_new_session()
    accounts = session.query(QuoraAccount).order_by(desc(QuoraAccount.id)).all()
    account_name_list = []
    division_name_list = []
    for account in accounts:
        account_name_list.append(account.first_name + " " + account.last_name + " (" + str(account.id) + ")")
    divisions = session.query(Division).order_by(asc(Division.id)).all()
    for division in divisions:
        division_name_list.append(division.division + ' (' + str(division.id) + ')')
    dataframe = pandas.DataFrame(columns=quora_asked_question_excel_headers)
    strIO = io.BytesIO()
    excel_writer = pandas.ExcelWriter(strIO, engine="xlsxwriter")
    dataframe.to_excel(excel_writer, sheet_name="sheet 1", index=False)
    worksheet = excel_writer.sheets["sheet 1"]
    worksheet.data_validation(1, 0, 1001, 0, {'validate': 'length', 'criteria': '>', 'minimum': '5', 'input_message': 'Fill up to 1000 Rows only'})
    worksheet.data_validation(1, 0, 1001, 1, {'validate': 'length', 'criteria': '>', 'minimum': '5', 'input_message': 'Text of the question as displayed on Quora'})
    worksheet.data_validation(1, 1, 1001, 2, {'validate': 'list', 'source': division_name_list})
    worksheet.data_validation(1, 2, 1001, 3, {'validate': 'list', 'source': account_name_list})
    worksheet.data_validation(1, 3, 1001, 4, {'validate': 'date', 'criteria': '>', 'minimum': get_time_interval(TimePeriod.MONTH.value), 'input_title': 'Enter a date after',
                                              'input_message': get_time_interval(TimePeriod.MONTH.value).date().__format__('%d %b, %Y').__str__()})
    excel_writer.save()
    strIO.seek(0)
    return strIO

def upload_asked_questions(file):
    df = pandas.read_excel(file)
    if set(df.columns.values.tolist()) != set(quora_asked_question_excel_headers) or df[quora_asked_question_excel_headers].isnull().values.any() or len(df.index) == 0 or len(df.index) > 1000:
        return False
    session = get_new_session()
    asked_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASKED).first()
    for index, row in df.iterrows():
        persisted_question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url.like(row['Question Url'])).first()
        account_id = row['Account'][row['Account'].index('(')+1: row['Account'].index(')')]
        if persisted_question is None:
            persisted_question = QuoraQuestion()
            persisted_question.question_url = row['Question Url'].encode(encoding)
            persisted_question.question_text = row['Question Text'].encode(encoding)
            persisted_question.asked_on = row['Asked On']
            persisted_question.division_id = row['Division'][row['Division'].index('(')+1: row['Division'].index(')')]
            session.add(persisted_question)
            persisted_qqad = None
        else:
            persisted_qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                QuoraQuestionAccountDetails.question_id == persisted_question.id,
                QuoraQuestionAccountDetails.account_id == account_id,
                QuoraQuestionAccountDetails.action_id == asked_action_object.id)).first()
        if persisted_qqad is None:
            qqad = QuoraQuestionAccountDetails()
            qqad.question = persisted_question
            qqad.action = asked_action_object
            qqad.account_id = account_id
            session.add(qqad)
    session.commit()
    return True

def delete_old_data():
    session = get_new_session()
    two_month_period = datetime.now() - relativedelta(months=2)
    question_ids = session.query(QuoraQuestion.id).filter(QuoraQuestion.asked_on < two_month_period).all()
    session.query(QuoraAccountStats).filter(QuoraAccountStats.recorded_on < two_month_period).delete(synchronize_session=False)
    session.query(QuoraAskedQuestionStats).filter(QuoraAskedQuestionStats.question_id.in_(question_ids)).delete(synchronize_session=False)
    session.query(QuoraQuestionAccountDetails).filter(QuoraQuestionAccountDetails.question_id.in_(question_ids)).delete(synchronize_session=False)
    session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).delete(synchronize_session=False)
    session.commit()
    return {}

def refresh_all_stats():
    session = get_new_session()
    script = session.query(Script).filter(Script.name == 'Refresh_Quora_Stats').first()
    execution_log = session.query(ExecutionLog).filter(ExecutionLog.script_id == script.id).first()
    if execution_log is None:
        execution_log = ExecutionLog()
        execution_log.script_id = script.id

    if execution_log.execution_time is None or execution_log.execution_time < get_time_interval(TimePeriod.DAY.value):
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

    execution_log.execution_time = datetime.now()
    session.add(execution_log)
    session.commit()
    return execution_log._asdict()

def get_last_refreshed():
    session = get_new_session()
    script = session.query(Script).filter(Script.name == 'Refresh_Quora_Stats').first()
    execution_log = session.query(ExecutionLog).filter(ExecutionLog.script_id == script.id).first()
    if execution_log is None:
        return {}
    return execution_log._asdict()