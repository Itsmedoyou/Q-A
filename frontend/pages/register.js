import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { xhrRequest, validateEmail, validatePassword, validateUsername } from '../utils/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error;
    }
    
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
      await xhrRequest('POST', '/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password
      }, null);
      
      window.location.href = '/login';
    } catch (error) {
      setApiError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Q&A Dashboard - Register</title>
        <meta name="description" content="Create your Q&A Dashboard account" />
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>
          
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
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors(prev => ({ ...prev, username: '' }));
                }}
              />
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>
            
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
                placeholder="At least 6 characters"
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
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-link">
            Already have an account? <Link href="/login">Login here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
