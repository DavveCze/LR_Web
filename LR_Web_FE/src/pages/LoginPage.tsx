import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  success?: boolean;
  status?: string;
  message?: string;
  token?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_RESET_TIME = 15 * 60 * 1000;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isSecure, setIsSecure] = useState(false);

  useEffect(() => {
    if (!isLocked || lockoutTime <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          localStorage.removeItem('lockoutEndTime');
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('lastAttemptTime');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLocked, lockoutTime]);

  const registerFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem('loginAttempts', String(newAttempts));
    localStorage.setItem('lastAttemptTime', String(Date.now()));

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem('lockoutEndTime', String(lockoutEnd));
      setIsLocked(true);
      setLockoutTime(Math.ceil(LOCKOUT_DURATION / 1000));
    }
  };

  const validateInput = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isLocked) {
      setError(`Account is locked. Please try again in ${lockoutTime} seconds.`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data: LoginResponse = await response.json();

      if (data.status === 'success') {
        setSuccess('Login successful! Redirecting...');
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastAttemptTime');
        localStorage.removeItem('lockoutEndTime');
        setTimeout(() => navigate('/admin/dashboard'), 1500);
      } else {
        setError(data.message || 'Login failed. Please try again.');
        registerFailedAttempt();
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lockoutEndTime = localStorage.getItem('lockoutEndTime');
    const loginAttempts = localStorage.getItem('loginAttempts');
    const lastAttemptTime = localStorage.getItem('lastAttemptTime');

    if (lockoutEndTime) {
      const remainingLockout = parseInt(lockoutEndTime, 10) - Date.now();
      if (remainingLockout > 0) {
        setIsLocked(true);
        setLockoutTime(Math.ceil(remainingLockout / 1000));
      } else {
        localStorage.removeItem('lockoutEndTime');
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastAttemptTime');
      }
    }

    if (loginAttempts) {
      setAttempts(parseInt(loginAttempts, 10));
    }

    if (lastAttemptTime) {
      const lastAttempt = parseInt(lastAttemptTime, 10);
      if (Date.now() - lastAttempt > ATTEMPT_RESET_TIME) {
        setAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastAttemptTime');
      }
    }

    setIsSecure(window.location.protocol === 'https:');
  }, []);

  const lockoutProgress = Math.max(0, Math.min(100, (attempts / MAX_ATTEMPTS) * 100));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#f8fafc_72%,_#eef2ff_100%)] px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between gap-8 bg-slate-950 px-8 py-10 text-white sm:px-10 lg:px-12">
            <div className="space-y-6">
              <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-amber-200">
                Secure access
              </span>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
                  Sign in and continue to your dashboard.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                  Protected login with attempt tracking, temporary lockout, and automatic redirect after success.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Attempts</div>
                <div className="mt-2 text-2xl font-semibold">{attempts}/{MAX_ATTEMPTS}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                  <span>Lockout status</span>
                  <span>{isLocked ? 'Active' : 'Ready'}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 transition-all duration-300"
                    style={{ width: `${lockoutProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {isLocked ? `Try again in ${lockoutTime} seconds.` : 'You can try again immediately.'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-10 sm:px-8 lg:px-12">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Login</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your credentials to access the admin dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                )}

                {isLocked && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Account locked due to multiple failed attempts. Try again in {lockoutTime} seconds.
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || isLocked}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isLocked}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="group inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/15 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  <span className="transition group-hover:translate-x-0.5">
                    {loading ? 'Logging in...' : 'Login'}
                  </span>
                </button>
              </form>

              <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Attempts left</div>
                  <div className="mt-1 font-medium text-slate-900">{Math.max(0, MAX_ATTEMPTS - attempts)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Secure connection</div>
                  <div className="mt-1 font-medium text-slate-900">{isSecure ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
