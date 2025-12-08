from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional

from ..schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from ..db import get_user_by_email, get_user_by_username, create_user, get_user_by_id, verify_password
from ..config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    return jwt.encode({"user_id": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            user = get_user_by_id(user_id)
            return dict(user) if user else None
    except JWTError:
        return None

async def require_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_admin(user: dict = Depends(require_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing_email = get_user_by_email(user_data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_id = create_user(user_data.username, user_data.email, user_data.password)
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=500, detail="User not found after creation")
    
    token = create_access_token(user_id)
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            user_id=user["user_id"],
            username=user["username"],
            email=user["email"],
            role=user["role"]
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = get_user_by_email(user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["user_id"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            user_id=user["user_id"],
            username=user["username"],
            email=user["email"],
            role=user["role"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(require_user)):
    return UserResponse(
        user_id=user["user_id"],
        username=user["username"],
        email=user["email"],
        role=user["role"]
    )
