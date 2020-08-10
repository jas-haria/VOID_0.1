from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import inspect, Column, String, ForeignKey, Integer, Date, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import date

Base = declarative_base()

schema = {'schema' : 'void_dev'}

def _asdictmethod(object):
    return {c.key: (str(getattr(object, c.key)) if isinstance(getattr(object, c.key), date) else getattr(object, c.key))
            for c in inspect(object).mapper.column_attrs}

class Division(Base):
    __tablename__ = "divisions"
    __table_args__ = schema

    id = Column('id', Integer, primary_key=True, nullable=False, autoincrement=True)
    division = Column('division', String(20), nullable=False, unique=True)

    def __repr__(self):
        return '<Division {}>'.format(self.id)

    def _asdict(self):
        return _asdictmethod(self)


class ExecutionLog(Base):
    __tablename__ = "execution_log"
    __table_args__ = schema

    script_id = Column('script_id', Integer, ForeignKey('void_dev.scripts.id'), primary_key=True)
    execution_time = Column('execution_time', DateTime)

    script = relationship('Script')

    def __repr__(self):
        return '<Script {}>'.format(self.script_id)

    def _asdict(self):
        return _asdictmethod(self)


class Location(Base):
    __tablename__ = "center_locations"
    __table_args__ = schema

    location_id = Column('location_id', String(25), primary_key=True, nullable=False)
    center_name = Column('center_name', String(50), nullable=False)

    def __repr__(self):
        return '<Location {}>'.format(self.location_id)

    def _asdict(self):
        return _asdictmethod(self)


class QuoraKeyword(Base):
    __tablename__ = "quora_keywords"
    __table_args__ = schema

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    division_id = Column('division', Integer, ForeignKey('void_dev.divisions.id'), nullable=False)
    keyword = Column('keyword', String(50), nullable=False)

    division = relationship('Division')

    def __repr__(self):
        return '<Division {} & KeyWord {}>'.format(self.division_id, self.keyword)

    def _asdict(self):
        return _asdictmethod(self)


class QuoraQuestion(Base):
    __tablename__ = "quora_questions"
    __table_args__ = schema

    id = Column('id', Integer, primary_key=True, nullable=False, autoincrement=True)
    question_url = Column('question_url', String, nullable=False)
    question_text = Column('question_text', String)
    division_id = Column('division', Integer, ForeignKey('void_dev.divisions.id'), nullable=False)
    asked_on = Column('asked_on', Date)
    evaluated = Column('evaluated', Boolean, default=False)

    division = relationship('Division')
    accounts = relationship('QuoraQuestionAccountDetails', back_populates='question')

    def __repr__(self):
        return '<Question {}>'.format(self.question_url)

    def _asdict(self):
        return _asdictmethod(self)


class QuoraQuestionAccountDetails(Base):
    __tablename__ = "quora_question_account_details"
    __table_args__ = schema

    question_id = Column('question_id', Integer, ForeignKey('void_dev.quora_questions.id'), primary_key=True)
    account_id = Column('quora_account_id', Integer, ForeignKey('void_dev.quora_accounts.id'), primary_key=True)
    assigned = Column('assigned', Boolean, default=False)
    answered = Column('answered', Boolean, default=False)
    requested = Column('requested', Boolean, default=False)
    asked = Column('asked', Boolean, default=False)

    question = relationship('QuoraQuestion', back_populates='accounts')
    account = relationship('QuoraAccount', back_populates='questions')

    def __repr__(self):
        return '<Question - Account {}>'.format(self.question_id - self.account_id)

    def _asdict(self):
        return _asdictmethod(self)


class QuoraAccount(Base):
    __tablename__ = "quora_accounts"
    __table_args__ = schema

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    first_name = Column('first_name', String(20))
    last_name = Column('last_name', String(20))
    email = Column('email', String(50), nullable=False)
    password = Column('quora_password', String(20), nullable=False)
    birth_date = Column('birth_date', DateTime)
    phone_number = Column('phone_number', String(15))
    link = Column('link', String(200), nullable=False)

    questions = relationship('QuoraQuestionAccountDetails', back_populates='account')

    def __repr__(self):
        return '<Quora Account {}>'.format(self.email)

    def _asdict(self):
        return _asdictmethod(self)


class Script(Base):
    __tablename__ = "scripts"
    __table_args__ = schema

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    name = Column('script_name', String(50))

    def __repr__(self):
        return '<Script {}>'.format(self.name)

    def _asdict(self):
        return _asdictmethod(self)

class QuoraAccountStats(Base):
    __tablename__ = "quora_account_stats"
    __table_args__ = schema

    account_id = Column('account_id', Integer, ForeignKey('void_dev.quora_accounts.id'), primary_key=True)
    recorded_on = Column('recorded_on', Date, primary_key=True)
    total_followers = Column('total_followers', Integer, default=0, nullable=False)
    view_count = Column('view_count', Integer, default=0, nullable=False)
    upvote_count = Column('upvote_count', Integer, default=0, nullable=False)
    share_count = Column('share_count', Integer, default=0, nullable=False)

    account = relationship('QuoraAccount')

    def __repr__(self):
        return '<Account - Recorded On {}>'.format(str(self.account_id) - str(self.recorded_on))

    def _asdict(self):
        return _asdictmethod(self)

class QuoraAskedQuestionStats(Base):
    __tablename__ = "quora_asked_questions_stats"
    __table_args__ = schema

    question_id = Column('question_id', Integer, ForeignKey('void_dev.quora_questions.id'), primary_key=True)
    recorded_on = Column('recorded_on', Date, primary_key=True)
    follower_count = Column('follower_count', Integer, default=0, nullable=False)
    view_count = Column('view_count', Integer, default=0, nullable=False)
    answer_count = Column('answer_count', Integer, default=0, nullable=False)

    question = relationship('QuoraQuestion')

    def __repr__(self):
        return '<Question - Recorded On {}>'.format(self.question_id - self.recorded_on)

    def _asdict(self):
        return _asdictmethod(self)