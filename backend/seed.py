from database import SessionLocal, engine, Base
import models
import auth
import datetime

# Create tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    # 1. Create a Default User (Assume a default user is logged in as per assignment if needed, or just for testing)
    test_user = db.query(models.User).filter(models.User.username == "testuser").first()
    if not test_user:
        hashed_password = auth.get_password_hash("password123")
        test_user = models.User(username="testuser", password_hash=hashed_password)
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print("Created testuser (password: password123)")
    else:
        print("testuser already exists.")

    # 2. Check if meetings exist
    if db.query(models.Meeting).count() > 0:
        print("Database already seeded with meetings.")
        db.close()
        return

    # 3. Create Sample Meetings
    now = datetime.datetime.utcnow()

    # Upcoming Meeting 1
    m1 = models.Meeting(
        id="123456789",
        title="Weekly Team Sync",
        description="Discussing weekly progress and blockers.",
        start_time=now + datetime.timedelta(days=1),
        duration=45,
        is_instant=False,
        host_id=test_user.id
    )

    # Upcoming Meeting 2
    m2 = models.Meeting(
        id="987654321",
        title="Product Roadmap Review",
        description="Reviewing Q3 roadmap and feature requests.",
        start_time=now + datetime.timedelta(hours=2),
        duration=60,
        is_instant=False,
        host_id=test_user.id
    )

    # Recent Meeting 1 (Past)
    m3 = models.Meeting(
        id="111222333",
        title="Engineering Standup",
        description="Daily standup.",
        start_time=now - datetime.timedelta(days=1),
        duration=15,
        is_instant=False,
        host_id=test_user.id
    )

    # Recent Meeting 2 (Past)
    m4 = models.Meeting(
        id="444555666",
        title="Design Critique",
        description="Reviewing the new UI dashboard designs.",
        start_time=now - datetime.timedelta(days=2),
        duration=30,
        is_instant=False,
        host_id=test_user.id
    )

    db.add_all([m1, m2, m3, m4])
    db.commit()
    print("Database seeded with sample upcoming and recent meetings!")
    db.close()

if __name__ == "__main__":
    seed_database()
