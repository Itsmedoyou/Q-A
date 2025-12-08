import sqlite3
from contextlib import contextmanager
from datetime import datetime
import bcrypt
from .config import ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_PASSWORD

DATABASE_PATH = "qa_dashboard.db"

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK(role IN ('guest', 'user', 'admin'))
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                question_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Escalated', 'Answered')),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS answers (
                answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                user_id INTEGER,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (question_id) REFERENCES questions(question_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (ADMIN_DEFAULT_EMAIL,))
        if not cursor.fetchone():
            hashed_password = hash_password(ADMIN_DEFAULT_PASSWORD)
            cursor.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                ("admin", ADMIN_DEFAULT_EMAIL, hashed_password, "admin")
            )
        
        conn.commit()

def get_user_by_email(email: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        return cursor.fetchone()

def get_user_by_username(username: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        return cursor.fetchone()

def get_user_by_id(user_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        return cursor.fetchone()

def create_user(username: str, email: str, password: str, role: str = "user"):
    hashed_password = hash_password(password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
            (username, email, hashed_password, role)
        )
        return cursor.lastrowid

def get_all_questions():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT q.*, u.username 
            FROM questions q 
            LEFT JOIN users u ON q.user_id = u.user_id 
            ORDER BY 
                CASE WHEN q.status = 'Escalated' THEN 0 ELSE 1 END,
                q.timestamp DESC
        ''')
        return cursor.fetchall()

def get_question_by_id(question_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM questions WHERE question_id = ?", (question_id,))
        return cursor.fetchone()

def create_question(message: str, user_id: int | None = None):
    timestamp = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO questions (user_id, message, timestamp, status) VALUES (?, ?, ?, ?)",
            (user_id, message, timestamp, "Pending")
        )
        return {"question_id": cursor.lastrowid, "user_id": user_id, "message": message, "timestamp": timestamp, "status": "Pending"}

def update_question_status(question_id: int, status: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE questions SET status = ? WHERE question_id = ?", (status, question_id))
    return get_question_by_id(question_id)

def get_answers_for_question(question_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT a.*, u.username 
            FROM answers a 
            LEFT JOIN users u ON a.user_id = u.user_id 
            WHERE a.question_id = ?
            ORDER BY a.timestamp ASC
        ''', (question_id,))
        return cursor.fetchall()

def create_answer(question_id: int, message: str, user_id: int | None = None):
    timestamp = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO answers (question_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)",
            (question_id, user_id, message, timestamp)
        )
        return {"answer_id": cursor.lastrowid, "question_id": question_id, "user_id": user_id, "message": message, "timestamp": timestamp}
