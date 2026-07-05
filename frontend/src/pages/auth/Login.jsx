import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { auth } from '../../services/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider
} from 'firebase/auth'

import { QueueJoinForm, QueueCodeForm } from './QueueForm';
import { ForgotPasswordForm } from './ForgotPasswordForm'

import './Login.css';
import logo from '../../assets/images/logo.png';

import left from '../../assets/black/left.png';
import right from '../../assets/black/right.png';

import uncheck from '../../assets/black/uncheck.png';
import check from '../../assets/black/check.png';

// Your backend API URL
const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'

const Login = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [register, setRegister] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [dob, setDOB] = useState('');
  const [phone, setPhone] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const [remember, setRemember] = useState(false);
  const [activeTab, setActiveTab] = useState('join');
  const [joinStep, setJoinStep] = useState(0);
  const [forgotStep, setForgotStep] = useState(0)

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'join')   setJoinStep(0);
    if (tab === 'forgot') setForgotStep(0);
  };

  const toggleVisible =
    activeTab === 'login' || activeTab === 'signup' ? true :
    activeTab === 'queueup'                          ? true :
    activeTab === 'join'                             ? joinStep === 0 :
    activeTab === 'forgot'                           ? false :
                                                        false

  const getRedirectPath = (role) => {
    switch(role) {
      case 'admin':
        return '/admin/overview'
      case 'staff':
      case 'doctor':
      case 'nurse':
      case 'receptionist':
        return '/staff/overview'
      case 'patient':
        return '/patient/overview'
      default:
        return '/login'
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Step 2: Get Firebase ID token
      const idToken = await user.getIdToken()

      // Step 3: Send token to backend for verification
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success) {
        // Step 4: Store user data and token (optional - for API calls later)
        localStorage.setItem('userToken', idToken)
        localStorage.setItem('userData', JSON.stringify(data.user))
        // Persist email if remember is checked
        if (remember) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        // Step 5: Redirect based on role
        const redirectPath = getRedirectPath(data.user.role)
        console.log('✅ Login successful:', data.user.email, 'Role:', data.user.role)
        console.log('🔄 Navigating to:', redirectPath)
        navigate(redirectPath)
        console.log('✅ Navigate called')
      } else {
        throw new Error(data.error || 'Login failed')
      }

    } catch (err) {
      console.error('❌ Login error:', err)
      
      let errorMessage = 'Login failed. Please try again.'
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Send credentials to backend — it creates the Firebase Auth
      // user AND the Firestore record in one shot.
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: register,
          password: signupPassword,
          firstName,
          lastName,
          phone,
          dob,
          role: 'patient',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Sign up failed')
      }

      // Step 2: Sign them in with Firebase client using the credentials
      // they just provided — backend already created the account so this
      // will succeed immediately.
      const userCredential = await signInWithEmailAndPassword(auth, register, signupPassword)
      const idToken = await userCredential.user.getIdToken()

      // Step 3: Store token + user data and redirect
      localStorage.setItem('userToken', idToken)
      localStorage.setItem('userData', JSON.stringify(data.user))

      const redirectPath = getRedirectPath(data.user.role)
      console.log('✅ Sign up successful:', data.user.email)
      navigate(redirectPath)

    } catch (err) {
      console.error('❌ Sign up error:', err)

      let errorMessage = 'Sign up failed. Please try again.'

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 6 characters'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail')
    if (saved) {
      setEmail(saved)
      setRemember(true)
    }
  }, [])

  const handleSocialLogin = async (providerName) => {
    setLoading(true)
    setError('')

    try {
      let provider
      
      switch(providerName) {
        case 'Google':
          provider = new GoogleAuthProvider()
          break
        case 'Apple':
          provider = new OAuthProvider('apple.com')
          break
        case 'Facebook':
          provider = new FacebookAuthProvider()
          break
        default:
          throw new Error('Invalid provider')
      }

      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const idToken = await user.getIdToken()

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success) {
        localStorage.setItem('userToken', idToken)
        localStorage.setItem('userData', JSON.stringify(data.user))

        const redirectPath = getRedirectPath(data.user.role)
        console.log('✅ Social login successful:', data.user.email, 'Role:', data.user.role)
        navigate(redirectPath)
      } else {
        throw new Error(data.error || 'Login failed')
      }

    } catch (err) {
      console.error('❌ Social login error:', err)
      
      let errorMessage = `${providerName} login failed. Please try again.`
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled'
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please enable popups and try again.'
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Please use your original login method.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-area">
        <div className="carousel-content">
          <div className="carousel-area">
            <div className="carousel-body">
              <div className="carousel-text">
                <h2 className="carousel-subtext">Medic</h2>
                <h1 className="carousel-title">Welcome!</h1>
                <h3 className="carousel-altext">Join a community of doctor, and patients.</h3>
                <p className="carousel-description">Managing your health shouldn't mean standing in long lines or losing track of where you are in the process. Medic is designed to make your visit to the Emergency Department smoother, faster, and less stressful.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-content">
          <div className="login-card">
            <h1 className="login-title">Welcome Back</h1>
    
            <p className="login-subtitle">
              We've missed you! <span className="login-highlight">Please enter your details.</span>
            </p>

            <div className="login-buttons">
              {toggleVisible && (
                <div className="auth-toggle">

                  {/* Left group: Join / Queue up */}
                  <div
                    className={`auth-toggle-group${
                      activeTab === 'join' || activeTab === 'queueup' ? ' group-active' : ' group-inactive'
                    }`}
                    onClick={() => {
                      if (activeTab !== 'join' && activeTab !== 'queueup') switchTab('join')
                    }}
                  >
                    <div className="auth-expanded-state">
                      <button
                        className={`auth-toggle-btn${activeTab === 'join' ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); switchTab('join') }}>
                        Join
                      </button>

                      <button
                        className={`auth-toggle-btn${activeTab === 'queueup' ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); switchTab('queueup') }}>
                        Queue up
                      </button>
                    </div>

                    <div className="auth-collapsed-state">
                      <span className="auth-collapsed-title">Join the Queue</span>
                      <span className="auth-collapsed-sub">Join or Queue up</span>
                    </div>
                  </div>

                  {/* Right group: Login / Sign up */}

                  <div
                    className={`auth-toggle-group${
                      activeTab === 'login' || activeTab === 'signup' ? ' group-active' : ' group-inactive'
                    }`}
                    onClick={() => {
                      if (activeTab !== 'login' && activeTab !== 'signup') switchTab('login')
                    }}
                  >
                    <div className="auth-expanded-state">
                      <button
                        className={`auth-toggle-btn${activeTab === 'login' ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); switchTab('login') }}>
                        Login
                      </button>

                      <button
                        className={`auth-toggle-btn${activeTab === 'signup' ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); switchTab('signup') }}>
                        Sign up
                      </button>
                    </div>

                    <div className="auth-collapsed-state">
                      <span className="auth-collapsed-title">Registration</span>
                      <span className="auth-collapsed-sub">Login or sign in</span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {activeTab === 'join'    && <QueueJoinForm onStepChange={setJoinStep} />}
            {activeTab === 'queueup' && <QueueCodeForm />}
            {activeTab === 'forgot'  && (
              <ForgotPasswordForm
                onStepChange={setForgotStep}
                onComplete={() => switchTab('login')}
                onFindAppointment={() => switchTab('queueup')}
              />
            )}

            {(activeTab === 'login') && (
              <>
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="baxter.evans@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="forgot-remember">
                    <div className="remember-me">
                      <div
                        className="check-area"
                        onClick={() => setRemember(prev => !prev)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRemember(prev => !prev) }}
                      >
                        <img
                          src={remember ? check : uncheck}
                          className="check-logo"
                          alt={remember ? 'checked' : 'unchecked'}
                        />
                      </div>

                      <p className="remember-text">Remember me</p>
                    </div>

                    <p className="forgot-link">
                      <a href="#" onClick={(e) => { e.preventDefault(); switchTab('forgot') }}>
                        Forgot password?
                      </a>
                    </p>
                  </div>

                  {error && <p className="login-error">{error}</p>}

                  <button type="submit" className="get-started-btn" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <div className="social-login">
                  <button 
                    className="social-btn google-btn"
                    onClick={() => handleSocialLogin('Google')}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>

                  <button 
                    className="social-btn apple-btn"
                    onClick={() => handleSocialLogin('Apple')}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </button>

                  <button 
                    className="social-btn facebook-btn"
                    onClick={() => handleSocialLogin('Facebook')}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}

            {(activeTab === 'signup') && (
              <>
                <form onSubmit={handleSignin} className="login-form">
                  <div className="form-groups">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        placeholder="Baxter"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        placeholder="Evans"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register">Email</label>
                    <input
                      type="email"
                      id="register"
                      placeholder="baxter.evans@gmail.com"
                      value={register}
                      onChange={(e) => setRegister(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="signupPassword">Password</label>
                    <input
                      type="password"
                      id="signupPassword"
                      placeholder="••••••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-groups">
                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth</label>
                      <input
                        type="date"
                        id="dob"
                        value={dob}
                        onChange={(e) => setDOB(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="1 (876) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="login-error">{error}</p>}

                  <button type="submit" className="get-started-btn" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>
                </form>

                <div className="social-login">
                  <button className="social-btn google-btn" onClick={() => handleSocialLogin('Google')}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button className="social-btn apple-btn" onClick={() => handleSocialLogin('Apple')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </button>
                  <button className="social-btn facebook-btn" onClick={() => handleSocialLogin('Facebook')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}

            <div className="notice">
              <p className="signup-link">
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchTab('signup') }}>Sign up</a>
              </p>

              <p className="term-link">
                By signing up you agree to our <a href="/terms">Terms & Conditions</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;