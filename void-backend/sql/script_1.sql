CREATE DATABASE IF NOT EXISTS VOID_DEV;

USE VOID_DEV;

CREATE TABLE IF NOT EXISTS DIVISIONS (
	ID INTEGER AUTO_INCREMENT,
    DIVISION VARCHAR(20),
    CONSTRAINT PK_DIVISIONS PRIMARY KEY (ID),
    CONSTRAINT UC_DIVISIONS_DIVISION UNIQUE (DIVISION)
);

CREATE TABLE IF NOT EXISTS QUORA_QUESTIONS (
    ID INTEGER AUTO_INCREMENT,
    QUESTION_URL TEXT NOT NULL,
	QUESTION_TEXT TEXT,
    DIVISION INTEGER NOT NULL,
    ASKED_ON DATE,
    DISREGARD BOOLEAN DEFAULT FALSE,
    CONSTRAINT PK_QUESTIONS PRIMARY KEY (ID),
    CONSTRAINT FK_QUESTIONS_DIVISION FOREIGN KEY (DIVISION) REFERENCES DIVISIONS(ID)
);

CREATE TABLE IF NOT EXISTS QUORA_KEYWORDS (
    ID INTEGER AUTO_INCREMENT,
    DIVISION INTEGER NOT NULL,
    KEYWORD VARCHAR(50),
    CONSTRAINT PK_QUORA_KEYWORDS PRIMARY KEY (ID),
    CONSTRAINT FK_QUORA_KEYWORDS_DIVISION FOREIGN KEY (DIVISION) REFERENCES DIVISIONS(ID)
);

CREATE TABLE IF NOT EXISTS CENTER_LOCATIONS (
    LOCATION_ID VARCHAR(25) NOT NULL,
    CENTER_NAME VARCHAR(50) NOT NULL,
    CONSTRAINT PK_CENTER_LOCATION PRIMARY KEY (LOCATION_ID)
);

INSERT INTO DIVISIONS (DIVISION) VALUES ('Vidyalankar'), ('Science'), ('BSCIT'), ('GATE'), ('Engineering'), ('StudEase'), ('Admit Abroad');

INSERT INTO QUORA_KEYWORDS (DIVISION, KEYWORD) VALUES (1, 'VIT Mumbai'), (1, 'Vidyalankar'), (1, 'vidyalankar college'), (1,'vidyalankar institute of technology'), (1,'vidyalankar classes'), (1,'Vidyalankar School of Information Technology'), (1,'Vidyalankar Diploma College'), (1,'Vidyalankar Polytechnic'),
 (2,'iit jee'), (2,'jee'),(2,'iit jee classes mumbai'), (2,'best neet classes mumbai'), (2,'best iit jee classes mumbai'), (2,'mht cet'), (2,'mh cet'), (2,'mhtcet classes mumbai'), (2,'best mht cet classes mumbai'), (2,'neet'), (2,'neet classes mumbai'), (2,'bitsat'), (2,'bitsat classes mumbai'), (2,'best bitsat classes mumbai'), (2,'bitsat preparation'),
 (3,'bscit classes in mumbai'), (3,'bscit classes mumbai'), (3, 'mumbai university bscit'), (3,'best bscit classes mumbai'),
 (4,'mtech india'), (4,'gate exam'), (4,'psu gate exam'), (4,'gate classes in mumbai'), (4,'best gate classes in mumbai'), (4,'GATE'),
 (5,'engineering classes mumbai'), (5, 'fe classes mumbai'), (5,'se classes mumbai'), (5,'te classes mumbai'), (5,'mumbai university engineering'), (5,'engineering mumbai university'), (5,'best engineering classes mumbai'),
 (6,'online gate classes'), (6,'best online gate classes'), (6,'best app for gate'), (6,'gate android app'),
 (7, 'gre classes in mumbai'), (7, 'gre classes mumbai'), (7, 'study abroad counselling in mumbai'), (7, 'study abroad counselling mumbai'), (7, 'abroad education counsellors mumbai');

INSERT INTO CENTER_LOCATIONS (LOCATION_ID, CENTER_NAME) VALUES ( '7760562933001019237 ',  'Vidyalankar Classes -Andheri '), ( '13110987815294434884 ',  'Vidyalankar Classes - Borivali(Bhandarkar Bhavan) '), ( '17493438805552723046 ',  'Vidyalankar Classes - Borivali(Landmark Building) '), ( '2134343411140012763 ',  'Bhavani Shankar Road Junior College of Science '),
( '2043349377754078974 ',  'Vidyalankar Classes - Chembur '), ( '4463720830483140607 ',  'Vidyalankar Classes - Ghatkopar '), ( '12014058896703999514 ',  'Vidyalankar Classes - Kalyan '), ( '2564776461742891564 ',  'Vidyalankar Classes - Kandivali '), ( '14119405071233287029 ',  'Vidyalankar Classes - Nerul '),
( '10004718908122045660 ',  'Vidyalankar Classes - Panvel '), ( '5308591117911507195 ',  'Vidyalankar Classes & Publications '), ( '12736941806860522576 ',  'Vidyalankar Classes - Pune(FC Road) '), ( '3364090668868165727 ',  'Vidyalankar Classes - PUNE(Pimpri) '), ( '16971542478744721451 ',  'Ratanbai Walbai Junior College '),
( '6847250793040778028 ',  'Vidyalankar Classes - Thane(Ishan Arcade) '), ( '15742769480289306820 ',  'Vidyalankar Classes - Thane(Naik Wadi) '), ( '2131648888016274920 ',  'Vidyalankar Classes - Thane(Parchure) '), ( '17001661978791282547 ',  'Vidyalankar Classes - Vashi '), ( '14479226342174298398 ',  'Vidyalankar Classes - Dadar East ');

CREATE TABLE IF NOT EXISTS SCRIPTS (
	ID INTEGER AUTO_INCREMENT,
    SCRIPT_NAME VARCHAR(50),
    CONSTRAINT PK_SCRIPTS PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS EXECUTION_LOG (
	SCRIPT_ID INTEGER,
    EXECUTION_TIME DATETIME,
	CONSTRAINT FK_EXECUTION_LOG_SCRIPT_ID FOREIGN KEY (SCRIPT_ID) REFERENCES SCRIPTS (ID)
);

CREATE TABLE IF NOT EXISTS QUORA_ACCOUNTS (
	ID INTEGER AUTO_INCREMENT,
    FIRST_NAME VARCHAR(20),
    LAST_NAME VARCHAR(20),
    EMAIL VARCHAR(50) NOT NULL,
    QUORA_PASSWORD VARCHAR(20) NOT NULL,
    BIRTH_DATE DATE,
    PHONE_NUMBER VARCHAR(15),
    LINK VARCHAR(200) NOT NULL,
    CONSTRAINT PK_QUORA_ACCOUNTS PRIMARY KEY (ID)
);

INSERT INTO QUORA_ACCOUNTS (FIRST_NAME, LAST_NAME, EMAIL, QUORA_PASSWORD, LINK) VALUES ('Misc', 'Account', 'unavailable', 'unavailable', 'unavailable');


CREATE TABLE IF NOT EXISTS QUORA_QUESTION_ACCOUNT_ACTIONS (
	ID INTEGER AUTO_INCREMENT,
    ACTION_NAME VARCHAR(20) NOT NULL,
    CONSTRAINT PK_QQAS PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS QUORA_QUESTION_ACCOUNT_DETAILS (
	QUESTION_ID INTEGER,
    QUORA_ACCOUNT_ID INTEGER,
    ACTION_ID INTEGER,
    CONSTRAINT FK_QQAD_QUESTION_ID FOREIGN KEY (QUESTION_ID) REFERENCES QUORA_QUESTIONS(ID),
    CONSTRAINT FK_QQAD_QA_ID FOREIGN KEY (QUORA_ACCOUNT_ID) REFERENCES QUORA_ACCOUNTS(ID),
    CONSTRAINT FK_QQAD_ACTION_ID FOREIGN KEY (ACTION_ID) REFERENCES QUORA_QUESTION_ACCOUNT_ACTIONS(ID),
    CONSTRAINT PK_QQAD PRIMARY KEY (QUESTION_ID, QUORA_ACCOUNT_ID, ACTION_ID)
);

INSERT INTO QUORA_QUESTION_ACCOUNT_ACTIONS(ACTION_NAME) VALUES ('ANSWERED'), ('ASKED'), ('ASSIGNED'), ('EVALUATED'), ('REQUESTED'), ('PASSED');

INSERT INTO SCRIPTS (SCRIPT_NAME) VALUES ('Refresh_Quora_Stats');

CREATE TABLE IF NOT EXISTS QUORA_ASKED_QUESTIONS_STATS (
	QUESTION_ID INTEGER,
    RECORDED_ON DATE,
    VIEW_COUNT INTEGER DEFAULT 0 NOT NULL,
    FOLLOWER_COUNT INTEGER DEFAULT 0 NOT NULL,
    ANSWER_COUNT INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT FK_QAQS_QUESTION_ID FOREIGN KEY (QUESTION_ID) REFERENCES QUORA_QUESTIONS(ID),
    CONSTRAINT PK_QAQS PRIMARY KEY (QUESTION_ID, RECORDED_ON)
);

CREATE TABLE IF NOT EXISTS QUORA_ACCOUNT_STATS (
	ACCOUNT_ID INTEGER,
    RECORDED_ON DATE,
    VIEW_COUNT INTEGER DEFAULT 0 NOT NULL,
    UPVOTE_COUNT INTEGER DEFAULT 0 NOT NULL,
    SHARE_COUNT INTEGER DEFAULT 0 NOT NULL,
    TOTAL_FOLLOWERS INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT FK_QAS_ACCOUNT_ID FOREIGN KEY (ACCOUNT_ID) REFERENCES QUORA_ACCOUNTS(ID),
    CONSTRAINT PK_QAS PRIMARY KEY (ACCOUNT_ID, RECORDED_ON)
);