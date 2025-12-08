import { useState } from 'react';
import { xhrRequest, validateAnswer } from '../utils/api';
import { getToken, isAdmin } from '../utils/auth';

export default function QuestionCard({ question, onUpdate, showAnswerForm = true }) {
  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    setAnswerError('');

    const validation = validateAnswer(answerText);
    if (!validation.valid) {
      setAnswerError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      await xhrRequest('POST', `/questions/${question.question_id}/answer`, {
        message: answerText.trim()
      }, token);
      setAnswerText('');
    } catch (error) {
      setAnswerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAnswered = async () => {
    setMarking(true);
    try {
      const token = getToken();
      await xhrRequest('POST', `/questions/${question.question_id}/mark-answered`, null, token);
    } catch (error) {
      alert(error.message);
    } finally {
      setMarking(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const token = getToken();
      await xhrRequest('POST', `/questions/${question.question_id}/escalate`, null, token);
    } catch (error) {
      alert(error.message);
    } finally {
      setEscalating(false);
    }
  };

  const statusClass = question.status.toLowerCase();
  const admin = isAdmin();

  return (
    <div className={`question-card ${statusClass}`}>
      <div className="question-header">
        <div>
          <span className={`status-badge status-${statusClass}`}>
            {question.status}
          </span>
        </div>
        <div className="question-meta">
          {question.username ? `Asked by ${question.username}` : 'Asked by Guest'} 
          {' '}&bull;{' '}
          {formatTimestamp(question.timestamp)}
        </div>
      </div>
      
      <div className="question-message">
        {question.message}
      </div>

      {admin && question.status !== 'Answered' && (
        <div className="question-actions">
          <button 
            onClick={handleMarkAnswered} 
            disabled={marking}
            className="btn btn-success"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            {marking ? 'Marking...' : 'Mark as Answered'}
          </button>
          {question.status !== 'Escalated' && (
            <button 
              onClick={handleEscalate} 
              disabled={escalating}
              className="btn btn-warning"
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              {escalating ? 'Escalating...' : 'Escalate'}
            </button>
          )}
        </div>
      )}

      {question.answers && question.answers.length > 0 && (
        <div className="answers-section">
          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            Answers ({question.answers.length})
          </h4>
          {question.answers.map((answer) => (
            <div 
              key={answer.answer_id} 
              className={`answer-item ${answer.is_ai_suggestion ? 'ai-suggestion' : ''}`}
            >
              {answer.is_ai_suggestion && (
                <span className="ai-tag">AI Suggestion</span>
              )}
              <p style={{ marginBottom: '6px' }}>{answer.message}</p>
              <div className="question-meta">
                {answer.username ? `By ${answer.username}` : 'By Guest'} 
                {' '}&bull;{' '}
                {formatTimestamp(answer.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAnswerForm && (
        <div className="answer-form">
          <form onSubmit={handleSubmitAnswer}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder="Write your answer..."
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  setAnswerError('');
                }}
              />
              {answerError && <div className="error-message">{answerError}</div>}
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
