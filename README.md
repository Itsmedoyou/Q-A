# Q&A Realtime Dashboard

A full-stack Q&A platform with real-time updates powered by WebSockets. Users can submit questions, provide answers, and admins can manage question statuses.

## Tech Stack

- **Frontend**: Next.js 14 with React 18
- **Backend**: FastAPI (Python)
- **Realtime**: WebSockets
- **Database**: SQLite
- **Auth**: JWT-based authentication

## Features

- Public question submission (no login required)
- User registration and login
- Real-time updates via WebSockets
- Admin-only actions (mark as answered, escalate)
- Forum with answer functionality
- XHR-based form validation
- Webhook integration (optional)

## Project Structure

```
/frontend (Next.js)
  /pages          - Next.js pages
  /components     - React components
  /utils          - Utility functions (API, auth, WebSocket)
  /styles         - CSS styles

/backend (FastAPI)
  main.py              - FastAPI application entry
  db.py                - Database operations
  config.py            - Configuration from environment
  websocket_manager.py - WebSocket connection manager
  /routers             - API route handlers
  /schemas             - Pydantic schemas
  /models              - Data models
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 20+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   ```
   ADMIN_DEFAULT_EMAIL=admin@example.com
   ADMIN_DEFAULT_PASSWORD=admin123
   WEBHOOK_URL=               # Optional webhook URL
   JWT_SECRET=your-secret-key
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the backend:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user info |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/questions` | Get all questions |
| POST | `/questions` | Submit a new question |
| POST | `/questions/{id}/answer` | Add an answer |
| POST | `/questions/{id}/mark-answered` | Mark as answered (admin only) |
| POST | `/questions/{id}/escalate` | Escalate question (admin only) |

### WebSocket

Connect to `/ws/questions` for real-time updates.

**Message Types:**
- `new_question` - New question submitted
- `new_answer` - New answer added
- `status_update` - Question status changed

**Example Connection (JavaScript):**
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${host}/ws/questions`);

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.data);
};
```

## User Roles

| Action | Guest | User | Admin |
|--------|-------|------|-------|
| View questions | Yes | Yes | Yes |
| Submit questions | Yes | Yes | Yes |
| Answer questions | Yes | Yes | Yes |
| Mark as answered | No | No | Yes |
| Escalate | No | No | Yes |

## Default Admin Account

- **Email**: admin@example.com
- **Password**: admin123

(Change these in production!)

## Webhook Integration

The system sends POST requests to the configured `WEBHOOK_URL` for the following events:

### 1. New Question Submitted
```json
{
  "event": "new_question",
  "question_id": 1,
  "message": "Question text",
  "username": "john_doe",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 2. New Answer Added
```json
{
  "event": "new_answer",
  "answer_id": 5,
  "question_id": 1,
  "message": "Answer text",
  "username": "jane_smith",
  "timestamp": "2024-01-01T12:05:00"
}
```

### 3. Question Marked as Answered
```json
{
  "event": "question_answered",
  "question_id": 1,
  "message": "Question text",
  "timestamp": "2024-01-01T12:10:00"
}
```

### 4. Question Escalated
```json
{
  "event": "question_escalated",
  "question_id": 1,
  "message": "Question text",
  "timestamp": "2024-01-01T12:15:00"
}
```

### Testing Webhooks
Use a free webhook testing service like [webhook.site](https://webhook.site) to test webhook delivery:
1. Visit https://webhook.site to get a unique URL
2. Set `WEBHOOK_URL` environment variable to your unique URL
3. Trigger events (submit question, add answer, mark answered, escalate)
4. View webhook payloads in real-time on webhook.site

## Development

### Run Both Servers

```bash
# Terminal 1 - Backend
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### API Documentation

When the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT
