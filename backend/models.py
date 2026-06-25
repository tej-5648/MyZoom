from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, index=True) # Zoom like 9-11 digit string
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    duration = Column(Integer, default=60) # in minutes
    is_instant = Column(Boolean, default=False)
    host_id = Column(Integer, index=True)
    host_name = Column(String, default="Default Host")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(String, index=True)
    display_name = Column(String)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
