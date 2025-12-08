import Link from 'next/link';
import { useRouter } from 'next/router';
import { isLoggedIn, isAdmin, getUser, clearAuth } from '../utils/auth';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const updateAuthState = () => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  };

  useEffect(() => {
    updateAuthState();

    const handleRouteChange = () => {
      updateAuthState();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link href="/" className="nav-brand">
          Q&A Dashboard
        </Link>
        <div className="nav-links">
          {loggedIn && (
            <>
              <Link href="/dashboard" className={`nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link href="/forum" className={`nav-link ${router.pathname === '/forum' ? 'active' : ''}`}>
                Forum
              </Link>
            </>
          )}
          {loggedIn ? (
            <>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {user?.username} {user?.role === 'admin' && '(Admin)'}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 14px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`nav-link ${router.pathname === '/login' ? 'active' : ''}`}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '6px 14px' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
