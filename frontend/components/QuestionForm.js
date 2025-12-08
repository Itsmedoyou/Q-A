import { useState } from 'react';
import { xhrRequest, validateQuestion } from '../utils/api';
import { getToken } from '../utils/auth';

export default function QuestionForm({ onSuccess }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateQuestion(message);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      await xhrRequest('POST', '/questions', {
        message: message.trim()
      }, token);
      
      setMessage('');
      setSuccess('Question submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
        Ask a Question
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            className="textarea"
            placeholder="Type your question here..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError('');
            }}
            rows={3}
          />
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
}
