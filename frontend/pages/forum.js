import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import QuestionForm from '../components/QuestionForm';
import QuestionCard from '../components/QuestionCard';
import ConnectionStatus from '../components/ConnectionStatus';
import { xhrRequest } from '../utils/api';
import { getAuth } from '../utils/auth';
import wsManager from '../utils/websocket';

export default function Forum() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const sortQuestions = (questionsList) => {
    return [...questionsList].sort((a, b) => {
      if (a.status === 'Escalated' && b.status !== 'Escalated') return -1;
      if (a.status !== 'Escalated' && b.status === 'Escalated') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  };

  const fetchQuestions = async () => {
    try {
      const data = await xhrRequest('GET', '/questions');
      setQuestions(sortQuestions(data));
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    if (!auth || !auth.token) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    fetchQuestions();

    if (wsManager) {
      wsManager.connect();

      const handleConnected = () => setConnected(true);
      const handleDisconnected = () => setConnected(false);
      
      const handleNewQuestion = (data) => {
        setQuestions(prev => sortQuestions([data, ...prev]));
      };

      const handleNewAnswer = (data) => {
        setQuestions(prev => {
          const updated = prev.map(q => {
            if (q.question_id === data.question_id) {
              return {
                ...q,
                answers: [...(q.answers || []), data.answer]
              };
            }
            return q;
          });
          return sortQuestions(updated);
        });
      };

      const handleStatusUpdate = (data) => {
        setQuestions(prev => {
          const updated = prev.map(q => 
            q.question_id === data.question_id ? { ...q, ...data } : q
          );
          return sortQuestions(updated);
        });
      };

      wsManager.on('connected', handleConnected);
      wsManager.on('disconnected', handleDisconnected);
      wsManager.on('new_question', handleNewQuestion);
      wsManager.on('new_answer', handleNewAnswer);
      wsManager.on('status_update', handleStatusUpdate);

      return () => {
        wsManager.off('connected', handleConnected);
        wsManager.off('disconnected', handleDisconnected);
        wsManager.off('new_question', handleNewQuestion);
        wsManager.off('new_answer', handleNewAnswer);
        wsManager.off('status_update', handleStatusUpdate);
      };
    }
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Q&A Dashboard - Forum</title>
        <meta name="description" content="Community Q&A Forum" />
      </Head>
      
      <div className="container">
        <h1 className="page-title">Community Forum</h1>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Ask questions and help others by providing answers. All updates appear in real-time.
        </p>
        
        <QuestionForm onSuccess={fetchQuestions} />
        
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            All Questions ({questions.length})
          </h2>
          
          {loading ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <h3>No questions yet</h3>
              <p>Be the first to ask a question!</p>
            </div>
          ) : (
            questions.map(question => (
              <QuestionCard 
                key={question.question_id} 
                question={question}
                showAnswerForm={true}
              />
            ))
          )}
        </div>
      </div>
      
      <ConnectionStatus connected={connected} />
    </>
  );
}
