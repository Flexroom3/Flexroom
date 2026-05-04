import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

// Importing your specific assets
import flexroomWhite from './assets/Flexroom-white.png';
import flexroomCircle from './assets/round-white.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-links">
          <button onClick={() => navigate('/signup')} className="btn-signup">Sign Up</button>
          <button onClick={() => navigate('/login')} className="btn-login">Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="logo-wrapper">
          {/* Main Hero Logo using your white asset */}
          <img 
            src={flexroomWhite} 
            alt="FlexRoom Logo" 
            className="hero-logo-img" 
          />
          <p className="tagline">An Academic Workspace and Evaluation System</p>
        </div>
      </header>

      {/* About Us Content */}
      <main className="about-section">
        <h2 className="about-title">About Us</h2>
        <div className="about-card">
          <p>
            FlexRoom is an integrated academic workflow and evaluation system designed to 
            streamline the way institutions manage teaching, learning, and assessment. It brings 
            together students, instructors, and administrators on a single platform to ensure 
            clarity, consistency, and efficiency across all academic processes.
          </p>
          <p>
            Our platform simplifies course management, assignment tracking, grading, and 
            performance evaluation through an intuitive and structured interface. By 
            centralizing these functions, FlexRoom reduces administrative overhead while 
            enabling educators to focus on meaningful engagement and learning outcomes.
          </p>
          <p>
            FlexRoom is built with adaptability in mind, making it suitable for a wide range of 
            academic environments. Whether used for small classrooms or large institutions, it 
            supports scalable workflows that align with evolving educational needs.
          </p>
          <p>
            We are committed to improving academic productivity through reliable technology 
            and thoughtful design.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Developed by AAM Loug ®</p>
        <div className="footer-logo">
          {/* Footer Logo using your circle asset */}
          <img 
            src={flexroomCircle} 
            alt="FR Icon" 
            className="footer-logo-img" 
          />
        </div>
      </footer>

      {/* Decorative Shapes remain for the doodle aesthetic */}
      <div className="shape triangle-pink"></div>
      <div className="shape triangle-green"></div>
      <div className="shape circle-pink-dashed"></div>
      <div className="shape squiggly-lines"></div>
    </div>
  );
};

export default LandingPage;