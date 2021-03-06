USE VOID_DEV;

CREATE TABLE QUORA_QUESTIONS_ARCHIEVE (
    ID INTEGER AUTO_INCREMENT,
    QUESTION_URL VARCHAR(500) NOT NULL,
	QUESTION_TEXT VARCHAR(400),
    CONSTRAINT PK_QQA PRIMARY KEY (ID),
    CONSTRAINT UC_QUESTION_URL UNIQUE (QUESTION_URL),
    FULLTEXT (QUESTION_TEXT)
);

CREATE TABLE QUORA_QUESTION_ARCHIEVE_ACCOUNT_DETAILS (
	QUESTION_ID INTEGER,
    QUORA_ACCOUNT_ID INTEGER,
    ACTION_ID INTEGER,
    CONSTRAINT FK_QQAAD_QUESTION_ID FOREIGN KEY (QUESTION_ID) REFERENCES QUORA_QUESTIONS_ARCHIEVE(ID),
    CONSTRAINT FK_QQAAD_QA_ID FOREIGN KEY (QUORA_ACCOUNT_ID) REFERENCES QUORA_ACCOUNTS(ID),
    CONSTRAINT FK_QQAAD_ACTION_ID FOREIGN KEY (ACTION_ID) REFERENCES QUORA_QUESTION_ACCOUNT_ACTIONS(ID),
    CONSTRAINT PK_QQAAD PRIMARY KEY (QUESTION_ID, QUORA_ACCOUNT_ID, ACTION_ID)
);

INSERT INTO QUORA_QUESTIONS_ARCHIEVE (QUESTION_URL, QUESTION_TEXT)
SELECT DISTINCT(Q.QUESTION_URL), Q.QUESTION_TEXT
FROM QUORA_QUESTIONS Q
INNER JOIN QUORA_QUESTION_ACCOUNT_DETAILS D
ON Q.ID = D.QUESTION_ID
INNER JOIN QUORA_QUESTION_ACCOUNT_ACTIONS A
ON D.ACTION_ID = A.ID
WHERE (A.ACTION_NAME LIKE 'ANSWERED'
OR A.ACTION_NAME LIKE 'ASKED')
AND Q.QUESTION_URL NOT IN (
    SELECT QUESTION_URL FROM QUORA_QUESTIONS_ARCHIEVE
);

INSERT INTO QUORA_QUESTION_ARCHIEVE_ACCOUNT_DETAILS (QUESTION_ID, QUORA_ACCOUNT_ID, ACTION_ID)
SELECT Q.ID, A.ID, ACT.ID
FROM QUORA_QUESTIONS_ARCHIEVE Q
INNER JOIN QUORA_QUESTIONS QUEST
ON Q.QUESTION_URL = QUEST.QUESTION_URL
INNER JOIN QUORA_QUESTION_ACCOUNT_DETAILS D
ON QUEST.ID = D.QUESTION_ID
INNER JOIN QUORA_QUESTION_ACCOUNT_ACTIONS ACT
ON D.ACTION_ID = ACT.ID
INNER JOIN QUORA_ACCOUNTS A
ON D.QUORA_ACCOUNT_ID = A.ID
WHERE (ACT.ACTION_NAME LIKE 'ANSWERED'
OR ACT.ACTION_NAME LIKE 'ASKED')
AND (Q.ID, A.ID, ACT.ID) NOT IN (
    SELECT QUESTION_ID, QUORA_ACCOUNT_ID, ACTION_ID FROM QUORA_QUESTION_ARCHIEVE_ACCOUNT_DETAILS
);

CREATE TABLE IF NOT EXISTS QUORA_ASKED_QUESTIONS_ARCHIEVE_STATS (
	QUESTION_ID INTEGER,
    RECORDED_ON DATE,
    VIEW_COUNT INTEGER DEFAULT 0 NOT NULL,
    FOLLOWER_COUNT INTEGER DEFAULT 0 NOT NULL,
    ANSWER_COUNT INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT FK_QAQAS_QUESTION_ID FOREIGN KEY (QUESTION_ID) REFERENCES QUORA_QUESTIONS_ARCHIEVE(ID),
    CONSTRAINT PK_QAQAS PRIMARY KEY (QUESTION_ID, RECORDED_ON)
);