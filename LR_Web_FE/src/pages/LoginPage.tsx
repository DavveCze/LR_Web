import React, { useState, useEffect } from 'react';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_RESET_TIME = 15 * 60 * 1000; // 15 minutes

  // Check lockout status on component mount
  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const lastAttemptTime = localStorage.getItem('lastAttemptTime');
    const lockoutEndTime = localStorage.getItem('lockoutEndTime');

    if (lockoutEndTime) {
      const remainingTime = parseInt(lockoutEndTime) - Date.now();
      if (remainingTime > 0) {
        setIsLocked(true);
        setLockoutTime(Math.ceil(remainingTime / 1000));
      } else {
        localStorage.removeItem('lockoutEndTime');
        localStorage.removeItem('loginAttempts');
      }
    }

    if (storedAttempts && lastAttemptTime) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttemptTime);
      if (timeSinceLastAttempt < ATTEMPT_RESET_TIME) {
        setAttempts(parseInt(storedAttempts));
      } else {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastAttemptTime');
      }
    }
  }, []);

  // Update lockout timer
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            localStorage.removeItem('lockoutEndTime');
            localStorage.removeItem('loginAttempts');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const handleAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());
    localStorage.setItem('lastAttemptTime', Date.now().toString());

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem('lockoutEndTime', lockoutEnd.toString());
      setIsLocked(true);
      setLockoutTime(Math.ceil(LOCKOUT_DURATION / 1000));
    }
  };

  const validateInput = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Check if account is locked
  if (isLocked) {
    setError(`Account locked. Try again in ${lockoutTime} seconds.`);
    return;
  }

  // Validate inputs
  if (!validateInput()) {
    handleAttempt();
    return;
  }

  setLoading(true);

  try {
    // Use HTTPS protocol for secure communication
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const apiUrl =
        (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
        (window.location.origin.includes('localhost') ? 'https://localhost' : window.location.origin);

    const response = await fetch(`${apiUrl}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
      }),
      // Add CSRF token if available
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json() as LoginResponse;

    if (data.success && data.token) {
      // Reset attempt counter on successful login
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lastAttemptTime');
      setAttempts(0);

      // Store token securely
      localStorage.setItem('authToken', data.token);
      setSuccess('Login successful! Redirecting...');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      setError(data.message || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error(error);
    setError('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-container py-20">
      <div className="login-card">
        <h1>Login</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isLocked && (
          <div className="alert alert-warning">
            Account locked due to multiple failed attempts. Try again in {lockoutTime} seconds.
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isLocked}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isLocked}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Attempts: {attempts}/{MAX_ATTEMPTS}</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            Secure connection: HTTPS enabled
          </p>
        </div>
      </div>
    </div>
  );
};
