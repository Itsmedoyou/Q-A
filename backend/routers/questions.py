from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import httpx

from ..schemas import QuestionCreate, QuestionResponse, AnswerCreate, AnswerResponse
from ..db import get_all_questions, get_question_by_id, create_question, update_question_status, get_answers_for_question, create_answer
from .auth import get_current_user, require_admin
from ..websocket_manager import manager
from ..config import WEBHOOK_URL

router = APIRouter(prefix="/questions", tags=["Questions"])

async def trigger_webhook(event: str, data: dict):
    if WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {"event": event, **data}
                await client.post(WEBHOOK_URL, json=payload)
        except:
            pass

def question_to_response(question, username: str | None = None, include_answers: bool = True) -> QuestionResponse:
    answers = []
    if include_answers:
        answers = [
            AnswerResponse(
                answer_id=a["answer_id"],
                question_id=a["question_id"],
                user_id=a["user_id"],
                username=a["username"] if "username" in a.keys() else None,
                message=a["message"],
                timestamp=a["timestamp"]
            )
            for a in get_answers_for_question(question["question_id"])
        ]
    
    return QuestionResponse(
        question_id=question["question_id"],
        user_id=question["user_id"],
        username=username or (question["username"] if "username" in question.keys() else None),
        message=question["message"],
        timestamp=question["timestamp"],
        status=question["status"],
        answers=answers
    )

@router.get("", response_model=List[QuestionResponse])
async def list_questions():
    questions = get_all_questions()
    return [question_to_response(q) for q in questions]

@router.post("", response_model=QuestionResponse)
async def submit_question(question_data: QuestionCreate, user: Optional[dict] = Depends(get_current_user)):
    question = create_question(question_data.message, user["user_id"] if user else None)
    response = question_to_response(question, username=user["username"] if user else None)
    await manager.broadcast({"type": "new_question", "data": response.model_dump()})
    await trigger_webhook("new_question", {
        "question_id": question["question_id"],
        "message": question["message"],
        "username": user["username"] if user else None,
        "timestamp": question["timestamp"]
    })
    return response

@router.post("/{question_id}/answer", response_model=AnswerResponse)
async def add_answer(question_id: int, answer_data: AnswerCreate, user: Optional[dict] = Depends(get_current_user)):
    if not get_question_by_id(question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer = create_answer(question_id, answer_data.message, user["user_id"] if user else None)
    response = AnswerResponse(
        answer_id=answer["answer_id"],
        question_id=answer["question_id"],
        user_id=answer["user_id"],
        username=user["username"] if user else None,
        message=answer["message"],
        timestamp=answer["timestamp"]
    )
    
    await manager.broadcast({"type": "new_answer", "data": {"question_id": question_id, "answer": response.model_dump()}})
    await trigger_webhook("new_answer", {
        "answer_id": answer["answer_id"],
        "question_id": question_id,
        "message": answer["message"],
        "username": user["username"] if user else None,
        "timestamp": answer["timestamp"]
    })
    return response

@router.post("/{question_id}/mark-answered", response_model=QuestionResponse)
async def mark_answered(question_id: int, admin: dict = Depends(require_admin)):
    if not get_question_by_id(question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated = update_question_status(question_id, "Answered")
    response = question_to_response(updated, include_answers=False)
    await manager.broadcast({"type": "status_update", "data": response.model_dump()})
    
    await trigger_webhook("question_answered", {
        "question_id": question_id,
        "message": updated["message"],
        "timestamp": updated["timestamp"]
    })
    
    return question_to_response(updated)

@router.post("/{question_id}/escalate", response_model=QuestionResponse)
async def escalate_question(question_id: int, admin: dict = Depends(require_admin)):
    if not get_question_by_id(question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated = update_question_status(question_id, "Escalated")
    response = question_to_response(updated, include_answers=False)
    await manager.broadcast({"type": "status_update", "data": response.model_dump()})
    await trigger_webhook("question_escalated", {
        "question_id": question_id,
        "message": updated["message"],
        "timestamp": updated["timestamp"]
    })
    return question_to_response(updated)
