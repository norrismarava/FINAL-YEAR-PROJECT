import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%', padding: '2rem' }} className="slide-in-left">
        <div style={{ textAlign: 'center' }}>
          <div className="float-animation" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#4f46e5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem', animationDelay: '0.2s' }} className="slide-in-up">
            Sign in to your account
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#4b5563', animationDelay: '0.3s' }} className="slide-in-up">
            Welcome back to WaitLess
          </p>
        </div>
        <form style={{ marginTop: '2rem', animationDelay: '0.4s' }} className="slide-in-up">
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              style={{
                appearance: 'none',
                borderRadius: '0.375rem',
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                placeholderColor: '#9ca3af',
                color: '#111827',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              style={{
                appearance: 'none',
                borderRadius: '0.375rem',
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                placeholderColor: '#9ca3af',
                color: '#111827',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                style={{ height: '1rem', width: '1rem', color: '#4f46e5', borderRadius: '0.25rem' }}
              />
              <label
                htmlFor="remember-me"
                style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#111827' }}
              >
                Remember me
              </label>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              <a href="/forgot-password" style={{ fontWeight: '500', color: '#4f46e5', textDecoration: 'none' }}>
                Forgot your password?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                color: 'white',
                backgroundColor: '#4f46e5',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Sign in
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              Don't have an account?{" "}
              <a href="/staff-register" style={{ fontWeight: '500', color: '#4f46e5', textDecoration: 'none' }}>
                Register here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}