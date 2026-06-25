# Zoom Clone - Fullstack Video Conferencing Platform

A functional, modern video conferencing web application designed as a clone of the Zoom web app. Built to replicate Zoom's design, user experience, and core meeting workflows, allowing users to easily create, schedule, join, and manage meetings.

## 🚀 Features

### Core Functionality (Must Haves)
* **Landing Dashboard**: A clean, professional UI heavily inspired by Zoom with quick actions for "New Meeting", "Join", and "Schedule".
* **Instant Meetings**: Create instant meetings with a single click, generating unique 9-10 digit Zoom-like IDs and shareable links.
* **Join Meetings**: Join via direct link or by entering a Meeting ID. Includes a display name prompt before joining.
* **Scheduled Meetings**: Schedule future meetings with topics, descriptions, date, time, and duration.
* **Upcoming & Recent Meetings**: Dashboard displays an organized list of upcoming and recently concluded meetings.

### Advanced Features (Bonus)
* **True WebRTC Screen Sharing**: Share your screen with other participants with native low-latency WebRTC streams.
* **Live Interactive Whiteboard**: Collaborative drawing canvas built directly into the meeting interface.
* **Host Controls**: The meeting host has exclusive capabilities to "Mute All" or "Remove" participants from the room.
* **In-Meeting Chat**: Real-time messaging system during meetings.
* **User Authentication**: Secure JWT-based Login/Signup system.
* **Fully Responsive**: Clean UI adapted for Desktop, Tablet, and Mobile views.

## 🛠 Tech Stack
* **Frontend**: Next.js 14, React 19, Tailwind CSS v4, Lucide Icons.
* **Backend**: Python 3, FastAPI, Uvicorn, WebSockets.
* **Database**: SQLite with SQLAlchemy ORM.
* **Real-time Engine**: FastAPI WebSockets & Native browser WebRTC API.

## 🗄 Database Design
The SQLite database schema is built using SQLAlchemy and contains three primary entities with appropriate relationships:
1. **User**: Stores authentication details (`id`, `username`, `password_hash`).
2. **Meeting**: Stores meeting metadata (`id` (String ID), `title`, `description`, `start_time`, `duration`, `is_instant`, `host_id` (Foreign Key)).
3. **Participant**: Tracks attendance per meeting (`id`, `meeting_id`, `display_name`, `joined_at`).

## ⚙️ Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder.
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Seed the database (creates sample meetings and a test user): `python seed.py`
6. Start the FastAPI server: `uvicorn main:app --reload --port 8000`

### 2. Frontend Setup
1. Open a new terminal window and navigate to the `frontend` folder.
2. Install dependencies: `npm install`
3. Start the Next.js development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Assumptions Made
* **Database**: Opted for SQLite for simplicity and portability to fulfill the assignment requirement without needing external containerized databases like PostgreSQL.
* **WebRTC Signaling**: Utilized the existing FastAPI WebSocket connection to act as the signaling server for exchanging ICE candidates and WebRTC offers/answers, avoiding 3rd-party signaling APIs.
* **Test User**: If authentication is bypassed (or for quick testing), the `seed.py` script automatically provisions a `testuser` account to simulate the "assume a default user is logged in" requirement.
