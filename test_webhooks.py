#!/usr/bin/env python3
"""
Webhook Testing Script for Q&A Dashboard
Tests all 4 webhook events: new_question, new_answer, question_answered, question_escalated
"""

import httpx
import json
import time
import asyncio

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

def login(email, password):
    """Login and get access token"""
    with httpx.Client() as client:
        response = client.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"Login failed: {response.text}")

def test_webhooks():
    """Test all webhook events"""
    
    print("=" * 60)
    print("Q&A Dashboard Webhook Testing")
    print("=" * 60)
    
    # Login as admin
    print("\n1. Logging in as admin...")
    token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Logged in successfully")
    
    # Test 1: new_question webhook
    print("\n2. Testing 'new_question' webhook...")
    with httpx.Client() as client:
        question_response = client.post(
            f"{BASE_URL}/questions",
            headers=headers,
            json={"message": "Test question for webhook testing?"}
        )
    if question_response.status_code == 200:
        question_id = question_response.json()["question_id"]
        print(f"✓ Question created (ID: {question_id})")
        print(f"   Webhook event: new_question")
        print(f"   Payload should include: question_id, message, username, timestamp")
    else:
        print(f"✗ Failed: {question_response.text}")
    
    time.sleep(1)
    
    # Test 2: new_answer webhook
    print("\n3. Testing 'new_answer' webhook...")
    with httpx.Client() as client:
        answer_response = client.post(
            f"{BASE_URL}/questions/{question_id}/answer",
            headers=headers,
            json={"message": "This is a test answer for webhook testing."}
        )
    if answer_response.status_code == 200:
        answer_id = answer_response.json()["answer_id"]
        print(f"✓ Answer created (ID: {answer_id})")
        print(f"   Webhook event: new_answer")
        print(f"   Payload should include: answer_id, question_id, message, username, timestamp")
    else:
        print(f"✗ Failed: {answer_response.text}")
    
    time.sleep(1)
    
    # Test 3: question_answered webhook
    print("\n4. Testing 'question_answered' webhook...")
    with httpx.Client() as client:
        mark_response = client.post(
            f"{BASE_URL}/questions/{question_id}/mark-answered",
            headers=headers
        )
    if mark_response.status_code == 200:
        print(f"✓ Question marked as answered")
        print(f"   Webhook event: question_answered")
        print(f"   Payload should include: question_id, message, timestamp")
    else:
        print(f"✗ Failed: {mark_response.text}")
    
    time.sleep(1)
    
    # Create another question for escalation test
    print("\n5. Creating another question for escalation test...")
    with httpx.Client() as client:
        question_response2 = client.post(
            f"{BASE_URL}/questions",
            headers=headers,
            json={"message": "Another test question for escalation webhook?"}
        )
    if question_response2.status_code == 200:
        question_id2 = question_response2.json()["question_id"]
        print(f"✓ Question created (ID: {question_id2})")
    
    time.sleep(1)
    
    # Test 4: question_escalated webhook
    print("\n6. Testing 'question_escalated' webhook...")
    with httpx.Client() as client:
        escalate_response = client.post(
            f"{BASE_URL}/questions/{question_id2}/escalate",
            headers=headers
        )
    if escalate_response.status_code == 200:
        print(f"✓ Question escalated")
        print(f"   Webhook event: question_escalated")
        print(f"   Payload should include: question_id, message, timestamp")
    else:
        print(f"✗ Failed: {escalate_response.text}")
    
    print("\n" + "=" * 60)
    print("Webhook Testing Complete!")
    print("=" * 60)
    print("\nAll 4 webhook events have been triggered:")
    print("  1. new_question")
    print("  2. new_answer")
    print("  3. question_answered")
    print("  4. question_escalated")
    print("\nCheck your webhook testing service (e.g., webhook.site)")
    print("to verify all webhook payloads were received correctly.")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_webhooks()
    except Exception as e:
        print(f"\n✗ Error: {e}")
