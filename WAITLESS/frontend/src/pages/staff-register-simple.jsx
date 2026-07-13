import { useState } from "react";

export default function StaffRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)'
    }}>
      <div style={{ maxWidth: '32rem', width: '100%', padding: '2rem' }} className="slide-in-right">
        <div style={{ textAlign: 'center' }}>
          <div className="float-animation" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#9333ea',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem', animationDelay: '0.2s' }} className="slide-in-up">
            Staff Registration
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#4b5563', animationDelay: '0.3s' }} className="slide-in-up">
            Join the WaitLess healthcare team
          </p>
        </div>
        <form style={{ marginTop: '2rem', animationDelay: '0.4s' }} className="slide-in-up">
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
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
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              placeholder="Email"
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
                backgroundColor: '#9333ea',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Register
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              Already have an account?{" "}
              <a href="/login" style={{ fontWeight: '500', color: '#9333ea', textDecoration: 'none' }}>
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}