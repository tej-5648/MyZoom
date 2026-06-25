from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    duration: int
    is_instant: bool = False

class MeetingCreate(MeetingBase):
    pass

class Meeting(MeetingBase):
    id: str
    host_id: int

    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    display_name: str
    meeting_id: str

class ParticipantCreate(ParticipantBase):
    pass

class Participant(ParticipantBase):
    id: int
    joined_at: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
