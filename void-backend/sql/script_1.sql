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
    EVALUATED BOOLEAN DEFAULT FALSE,
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

INSERT INTO DIVISIONS (DIVISION) VALUES ('Vidyalankar'), ('Science'), ('BSCIT'), ('GATE'), ('Engineering');

INSERT INTO QUORA_KEYWORDS (DIVISION, KEYWORD) VALUES (1, 'VIT Mumbai'), (1, 'Vidyalankar'), (1, 'vidyalankar college'), (1,'vidyalankar institute of technology'), (1,'vidyalankar classes'), (1,'Vidyalankar School of Information Technology'), (1,'Vidyalankar Diploma College'), (1,'Vidyalankar Polytechnic'),
 (2,'iit jee'), (2,'jee'),(2,'iit jee classes mumbai'), (2,'best neet classes mumbai'), (2,'best iit jee classes mumbai'), (2,'mht cet'), (2,'mh cet'), (2,'mhtcet classes mumbai'), (2,'best mht cet classes mumbai'), (2,'neet'), (2,'neet classes mumbai'), (2,'bitsat'), (2,'bitsat classes mumbai'), (2,'best bitsat classes mumbai'), (2,'bitsat preparation'),
 (3,'bscit classes in mumbai'), (3,'bscit classes mumbai'), (3,'fy bscit classes mumbai'), (3,'sy bscit classes mumbai'), (3, 'mumbai university bscit'), (3,'best bscit classes mumbai'),
 (4,'mtech india'), (4,'gate exam'), (4,'psu gate exam'), (4,'gate classes in mumbai'), (4,'best gate classes in mumbai'), (4,'GATE'),
 (5,'engineering classes mumbai'), (5, 'fe classes mumbai'), (5,'se classes mumbai'), (5,'te classes mumbai'), (5,'mumbai university engineering'), (5,'engineering mumbai university'), (5,'best engineering classes mumbai');

INSERT INTO CENTER_LOCATIONS (LOCATION_ID, CENTER_NAME) VALUES ( '7760562933001019237 ',  'Vidyalankar Classes -Andheri '), ( '13110987815294434884 ',  'Vidyalankar Classes - Borivali(Bhandarkar Bhavan) '), ( '17493438805552723046 ',  'Vidyalankar Classes - Borivali(Landmark Building) '), ( '2134343411140012763 ',  'Bhavani Shankar Road Junior College of Science '),
( '2043349377754078974 ',  'Vidyalankar Classes - Chembur '), ( '8575312462449434948 ',  'Vidyalankar Classes - Dombivli '), ( '4463720830483140607 ',  'Vidyalankar Classes - Ghatkopar '), ( '12014058896703999514 ',  'Vidyalankar Classes - Kalyan '), ( '2564776461742891564 ',  'Vidyalankar Classes - Kandivali '), ( '14119405071233287029 ',  'Vidyalankar Classes - Nerul '),
( '10004718908122045660 ',  'Vidyalankar Classes - Panvel '), ( '5308591117911507195 ',  'Vidyalankar Classes & Publications '), ( '12736941806860522576 ',  'Vidyalankar Classes - Pune(FC Road) '), ( '3364090668868165727 ',  'Vidyalankar Classes - PUNE(Pimpri) '), ( '16971542478744721451 ',  'Ratanbai Walbai Junior College '),
( '6847250793040778028 ',  'Vidyalankar Classes - Thane(Ishan Arcade) '), ( '15742769480289306820 ',  'Vidyalankar Classes - Thane(Naik Wadi) '), ( '2131648888016274920 ',  'Vidyalankar Classes - Thane(Parchure) '), ( '17001661978791282547 ',  'Vidyalankar Classes - Vashi '), ( '14479226342174298398 ',  'Vidyalankar Classes - Dadar East ');