import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { xhrRequest, validateEmail, validatePassword } from '../utils/api';
import { setAuth } from '../utils/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await xhrRequest('POST', '/auth/login', {
        email: email.trim(),
        password
      }, null);
      
      setAuth(response.access_token, response.user);
      
      // Defer navigation to next event loop to ensure localStorage writes complete
      setTimeout(() => {
        router.replace('/');
      }, 0);
    } catch (error) {
      setApiError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Q&A Dashboard - Login</title>
        <meta name="description" content="Login to Q&A Dashboard" />
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          
          {apiError && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#991b1b', 
              padding: '12px 16px', 
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {apiError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(prev => ({ ...prev, password: '' }));
                }}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="auth-link">
            Don't have an account? <Link href="/register">Register here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
