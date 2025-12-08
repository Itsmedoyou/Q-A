import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_DEFAULT_EMAIL = os.getenv("ADMIN_DEFAULT_EMAIL", "admin@example.com")
ADMIN_DEFAULT_PASSWORD = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qa_dashboard.db")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
