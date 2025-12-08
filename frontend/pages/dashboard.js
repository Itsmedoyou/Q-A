import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import QuestionCard from '../components/QuestionCard';
import ConnectionStatus from '../components/ConnectionStatus';
import { xhrRequest } from '../utils/api';
import { getAuth } from '../utils/auth';
import wsManager from '../utils/websocket';

export default function Dashboard() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState('all');
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

  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    return q.status.toLowerCase() === filter;
  });

  const counts = {
    all: questions.length,
    pending: questions.filter(q => q.status === 'Pending').length,
    escalated: questions.filter(q => q.status === 'Escalated').length,
    answered: questions.filter(q => q.status === 'Answered').length,
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Q&A Dashboard - Live Dashboard</title>
        <meta name="description" content="Real-time Q&A Dashboard" />
      </Head>
      
      <div className="container">
        <h1 className="page-title">Live Dashboard</h1>
        
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              All ({counts.all})
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Pending ({counts.pending})
            </button>
            <button 
              onClick={() => setFilter('escalated')}
              className={`btn ${filter === 'escalated' ? 'btn-warning' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Escalated ({counts.escalated})
            </button>
            <button 
              onClick={() => setFilter('answered')}
              className={`btn ${filter === 'answered' ? 'btn-success' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Answered ({counts.answered})
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <h3>No questions found</h3>
            <p>
              {filter === 'all' 
                ? 'No questions have been submitted yet.' 
                : `No ${filter} questions at the moment.`}
            </p>
          </div>
        ) : (
          filteredQuestions.map(question => (
            <QuestionCard 
              key={question.question_id} 
              question={question}
              showAnswerForm={false}
            />
          ))
        )}
      </div>
      
      <ConnectionStatus connected={connected} />
    </>
  );
}
