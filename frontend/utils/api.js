export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  const host = window.location.host;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:8000';
  }


  console.warn("⚠ NEXT_PUBLIC_API_URL is NOT set. Using '/api' fallback.");
  return '/api';
}


export function xhrRequest(method, url, data = null, token = undefined) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fullUrl = url.startsWith('http') ? url : `${getApiUrl()}${url}`;
    
    xhr.open(method, fullUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Auto-fetch token from localStorage only if token parameter is undefined (not explicitly null)
    // This allows callers to explicitly pass null to skip Authorization header (e.g., for login/register)
    const authToken = token !== undefined ? token : (typeof window !== 'undefined' ? localStorage.getItem('qa_dashboard_token') : null);
    
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          // Handle 401 Unauthorized - clear expired/invalid tokens and redirect to login
          if (xhr.status === 401) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('qa_dashboard_token');
              localStorage.removeItem('qa_dashboard_user');
              // Only redirect if not already on login/register pages
              if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
              }
            }
          }
          
          let errorMessage = 'Request failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.detail || errorResponse.message || 'Request failed';
          } catch (e) {
            errorMessage = xhr.statusText || 'Request failed';
          }
          reject(new Error(errorMessage));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error occurred'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('Request timed out'));
    };
    
    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
}

function validate(value, rules) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: rules.emptyError };
  }
  if (rules.pattern && !rules.pattern.test(value.trim())) {
    return { valid: false, error: rules.patternError };
  }
  if (rules.minLength && value.length < rules.minLength) {
    return { valid: false, error: `Must be at least ${rules.minLength} characters` };
  }
  return { valid: true, error: null };
}

export const validateQuestion = (msg) => validate(msg, { emptyError: 'Question cannot be empty or whitespace only' });
export const validateAnswer = (msg) => validate(msg, { emptyError: 'Answer cannot be empty or whitespace only' });
export const validateUsername = (name) => validate(name, { emptyError: 'Username is required' });
export const validatePassword = (pwd) => validate(pwd, { emptyError: 'Password is required', minLength: 6 });
export const validateEmail = (email) => validate(email, {
  emptyError: 'Email is required',
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  patternError: 'Invalid email format'
});
