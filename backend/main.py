from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict
import uuid
import random

from database import engine, get_db, Base
import models
import schemas
import auth

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # meeting_id -> list of dicts: {"websocket": WebSocket, "user_id": str, "name": str}
        self.active_connections: Dict[str, List[dict]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        # We append a placeholder until we get the join message
        self.active_connections[meeting_id].append({"websocket": websocket, "user_id": None, "name": None})

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id] if conn["websocket"] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, message: dict, meeting_id: str):
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                try:
                    await connection["websocket"].send_json(message)
                except:
                    pass

    async def broadcast_participants(self, meeting_id: str):
        if meeting_id in self.active_connections:
            participants = [
                {"id": conn["user_id"], "name": conn["name"]}
                for conn in self.active_connections[meeting_id]
                if conn["user_id"] is not None
            ]
            # Deduplicate by id
            unique_participants = {p['id']: p for p in participants}.values()
            await self.broadcast({"type": "sync-participants", "participants": list(unique_participants)}, meeting_id)

manager = ConnectionManager()

import re

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"\d", user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Meeting Routes ---
def generate_meeting_id():
    return str(random.randint(1000000000, 9999999999))

@app.get("/api/meetings", response_model=List[schemas.Meeting])
def get_meetings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Currently returns all meetings
    meetings = db.query(models.Meeting).offset(skip).limit(limit).all()
    return meetings

@app.post("/api/meetings", response_model=schemas.Meeting)
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    meeting_id = generate_meeting_id()
    
    while db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first():
        meeting_id = generate_meeting_id()

    db_meeting = models.Meeting(
        id=meeting_id,
        title=meeting.title,
        description=meeting.description,
        start_time=meeting.start_time,
        duration=meeting.duration,
        is_instant=meeting.is_instant,
        host_id=current_user.id
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.get("/api/meetings/{meeting_id}")
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    db_meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if db_meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Also fetch the host username
    host = db.query(models.User).filter(models.User.id == db_meeting.host_id).first()
    
    return {
        "id": db_meeting.id,
        "title": db_meeting.title,
        "description": db_meeting.description,
        "start_time": db_meeting.start_time,
        "duration": db_meeting.duration,
        "host_id": db_meeting.host_id,
        "host_name": host.username if host else "Unknown"
    }

# --- WebSocket Route ---
@app.websocket("/ws/meeting/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    await manager.connect(websocket, meeting_id)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "join":
                # Find the connection for this websocket and update user info
                if meeting_id in manager.active_connections:
                    for conn in manager.active_connections[meeting_id]:
                        if conn["websocket"] == websocket:
                            conn["user_id"] = str(data.get("userId"))
                            conn["name"] = data.get("name")
                            break
                # Broadcast updated participants list
                await manager.broadcast_participants(meeting_id)
            else:
                # Broadcast other messages to all clients
                await manager.broadcast(data, meeting_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)
        await manager.broadcast_participants(meeting_id)
