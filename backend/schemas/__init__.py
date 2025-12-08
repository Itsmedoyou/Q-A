from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
import re

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

    @field_validator('username')
    @classmethod
    def username_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip()

    @field_validator('email')
    @classmethod
    def email_valid(cls, v):
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v.strip()):
            raise ValueError('Invalid email format')
        return v.strip()

    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if not v or len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def email_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        return v.strip()

    @field_validator('password')
    @classmethod
    def password_not_empty(cls, v):
        if not v:
            raise ValueError('Password cannot be empty')
        return v

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str

class QuestionCreate(BaseModel):
    message: str

    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        return v.strip()

class QuestionResponse(BaseModel):
    question_id: int
    user_id: Optional[int]
    username: Optional[str]
    message: str
    timestamp: str
    status: str
    answers: List['AnswerResponse'] = []

class AnswerCreate(BaseModel):
    message: str

    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Answer cannot be empty')
        return v.strip()

class AnswerResponse(BaseModel):
    answer_id: int
    question_id: int
    user_id: Optional[int]
    username: Optional[str]
    message: str
    timestamp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

QuestionResponse.model_rebuild()
