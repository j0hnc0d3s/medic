import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider 
} from 'firebase/auth'

import './Login.css';
import doctor1 from '../assets/doctor1.png';
import logo from '../assets/logo.png';

// Your backend API URL
const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Transparency at your fingertips.",
      subtitle: "Get real-time updates."
    },
    {
      title: "Queue management made simple.",
      subtitle: "Know your wait time instantly."
    },
    {
      title: "Your health, your control.",
      subtitle: "Book appointments anytime."
    }
  ];

  // Helper function to get redirect path based on role
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

  // Email/Password Login
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

        // Step 5: Redirect based on role
        const redirectPath = getRedirectPath(data.user.role)
        console.log('✅ Login successful:', data.user.email, 'Role:', data.user.role)
        navigate(redirectPath)
      } else {
        throw new Error(data.error || 'Login failed')
      }

    } catch (err) {
      console.error('❌ Login error:', err)
      
      // User-friendly error messages
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

  // Social Login Handler
  const handleSocialLogin = async (providerName) => {
    setLoading(true)
    setError('')

    try {
      let provider
      
      // Select provider
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

      // Step 1: Sign in with popup
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Step 2: Get Firebase ID token
      const idToken = await user.getIdToken()

      // Step 3: Send token to backend
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
        // Store user data
        localStorage.setItem('userToken', idToken)
        localStorage.setItem('userData', JSON.stringify(data.user))

        // Redirect based on role
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="carousel-content">
          <div className="hero-image">
            <img 
              src={doctor1} 
              alt="Healthcare Professional" 
              className="doctor-img"
            />
          </div>
          
          <div className="carousel-text">
            <p className="carousel-subtitle">We pride ourselves on</p>
            <h2 className="carousel-title">{slides[currentSlide].title}</h2>
            <h2 className="carousel-title">{slides[currentSlide].subtitle}</h2>
          </div>

          {/* Carousel Navigation */}
          <div className="carousel-controls">
            <div className="carousel-dots">
              {slides.map((_, index) => (
                <span 
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            
            <div className="carousel-arrows">
              <button className="arrow-btn" onClick={prevSlide}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="arrow-btn" onClick={nextSlide}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          {/* Medic Logo */}
          <div className="medic-logo">
            <img src={logo} className="medic-logo-img" alt="Medic Logo" />
          </div>

          <h1 className="login-title">Create an account</h1>
  
          <p className="login-subtitle">
            Access your tasks, notes, and projects anytime, anywhere—and keep everything flowing in one place.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Your email</label>
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

            <button type="submit" className="get-started-btn">
              Get Started
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

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

          <p className="signup-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;