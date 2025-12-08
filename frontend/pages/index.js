import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import QuestionForm from '../components/QuestionForm';
import QuestionCard from '../components/QuestionCard';
import ConnectionStatus from '../components/ConnectionStatus';
import { xhrRequest } from '../utils/api';
import { getAuth } from '../utils/auth';
import wsManager from '../utils/websocket';

export default function Home() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    const checkAuth = async () => {
      // Small delay to ensure localStorage is readable after navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const auth = getAuth();
      
      if (!auth || !auth.token) {
        router.replace('/login');
        return;
      }

      setIsAuthenticated(true);
      setCheckingAuth(false);
      fetchQuestions();
    };
    
    checkAuth();

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

  if (checkingAuth) {
    return (
      <>
        <Head>
          <title>Q&A Dashboard - Loading</title>
        </Head>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            marginTop: '24px',
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}>Loading your dashboard...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Q&A Dashboard - Home</title>
        <meta name="description" content="Real-time Q&A Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="container">
        <h1 className="page-title">Welcome to Q&A Dashboard</h1>
        
        <QuestionForm onSuccess={fetchQuestions} />
        
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Recent Questions
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
                showAnswerForm={false}
              />
            ))
          )}
        </div>
      </div>
      
      <ConnectionStatus connected={connected} />
    </>
  );
}
