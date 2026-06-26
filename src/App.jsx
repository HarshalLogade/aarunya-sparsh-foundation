import { useState, useEffect } from 'react'
import './App.css'
import logoImg from './assets/logo.png'

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])



  return (
    <>
      {/* ========== NAVBAR ========== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo">
          <img src={logoImg} alt="Aarunya Sparsha Logo" className="nav-logo-img" />
          <span className="nav-logo-text">Aarunya <span>Sparsha</span> Foundation</span>
        </a>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="#hero" className="active" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
          <a href="#pillars" onClick={() => setMenuOpen(false)}>Programs</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </div>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">
              <span className="hero-title-line">Aarunya</span>
              <span className="hero-title-line"><span className="highlight-orange">Sparsha</span></span>
            </h1>
            <div className="hero-foundation-divider">
              <span className="hero-divider-line"></span>
              <span className="hero-foundation-text">Foundation</span>
              <span className="hero-divider-line"></span>
            </div>
            <span className="hero-title-cursive">Touching Lives, Creating Smiles,<br/>Building a Better Tomorrow. <span className="heart-icon">♡</span></span>
            <p className="hero-desc">
              We are committed to bringing positive change in the lives of people
              and building a stronger, kinder society.
            </p>
            <div className="hero-buttons">
              <a href="#about" className="btn-primary">
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#contact" className="btn-outline">
                Contact Us
              </a>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-divider-vertical"></div>
            <div className="hero-quote">
              <span className="hero-quote-open">“</span>
              <h3>Together,<br/>We Can Create</h3>
              <p className="hero-quote-highlight">Big Change</p>
              <span className="hero-quote-close">”</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== OUR MISSION SECTION ========== */}
      <section className="about-section" id="about">
        <div className="about-left animate-in">
          <span className="section-label">Our Mission</span>
          <h2 className="about-title">
            A foundation built on <span className="cursive">compassion</span>
          </h2>
          <p className="about-desc">
            We are committed to bringing positive change in the lives of people 
            and building a stronger, kinder society. ♡
          </p>
          <div className="about-features">
            <div className="about-feature-item">
              <div className="about-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="about-feature-content">
                <h4>Touching Lives</h4>
                <p>Creating meaningful impact in the lives of people across communities.</p>
              </div>
            </div>
            <div className="about-feature-item">
              <div className="about-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="about-feature-content">
                <h4>Creating Smiles</h4>
                <p>Bringing joy and hope to underprivileged communities through our initiatives.</p>
              </div>
            </div>
            <div className="about-feature-item">
              <div className="about-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="about-feature-content">
                <h4>Building a Better Tomorrow</h4>
                <p>Working towards a stronger, kinder society for future generations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FIVE PILLARS SECTION ========== */}
      <section className="pillars-section" id="pillars">
        <div className="pillars-inner">
          <div className="pillars-header animate-in">
            <span className="section-label">What We Do</span>
            <h2 className="section-title">
              Five pillars, <span className="cursive">our mandate</span>
            </h2>
            <p className="section-desc">
              Our work is guided by five core pillars that drive meaningful and lasting 
              impact in the communities we serve across rural India.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card animate-in">
              <div className="pillar-card-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Education</h3>
              <p>Empowering minds, shaping futures.</p>
            </div>

            <div className="pillar-card animate-in">
              <div className="pillar-card-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3>Healthcare</h3>
              <p>Better health, better lives.</p>
            </div>

            <div className="pillar-card animate-in">
              <div className="pillar-card-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Environment</h3>
              <p>Protect nature, preserve life.</p>
            </div>

            <div className="pillar-card animate-in">
              <div className="pillar-card-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Community</h3>
              <p>Stronger communities, brighter tomorrow.</p>
            </div>

            <div className="pillar-card animate-in">
              <div className="pillar-card-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h3>Empowerment</h3>
              <p>Empowering people, transforming society.</p>
            </div>


          </div>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section className="contact-section" id="contact">
        <div className="contact-content">
          <div className="contact-left animate-in">
            <span className="section-label">Contact</span>
            <h2 className="contact-title">
              Let's <span className="cursive">connect</span>
            </h2>
            <p className="contact-desc">
              Have questions or want to get involved? We'd love to hear from you. 
              Reach out to us through any of the channels below.
            </p>
            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="contact-item-content">
                  <h4>Phone</h4>
                  <p>7756920364 / 7387728331</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="contact-item-content">
                  <h4>Email</h4>
                  <p>Aarunyasparshafoundation@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="contact-item-content">
                  <h4>Location</h4>
                  <p>Vasai, Maharashtra</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
                <div className="contact-item-content">
                  <h4>Instagram</h4>
                  <p>aarunya_sparsha_foundation</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </div>
                <div className="contact-item-content">
                  <h4>Facebook</h4>
                  <p>Aarunya Sparsha Foundation</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-logo">
                <img src={logoImg} alt="Aarunya Sparsha Logo" className="footer-brand-logo-img" />
                <span className="footer-brand-name">Aarunya Sparsha</span>
              </div>
              <p>
                Touching Lives, Creating Smiles, Building a Better Tomorrow.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect x="2" y="9" width="4" height="12"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#hero">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#pillars">Programs</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#">Gallery</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Programs</h4>
              <ul>
                <li><a href="#">Education</a></li>
                <li><a href="#">Healthcare</a></li>
                <li><a href="#">Environment</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Empowerment</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Get Involved</h4>
              <ul>
                <li><a href="#">Join Us</a></li>
                <li><a href="#">Support Us</a></li>
                <li><a href="#">Volunteer</a></li>
                <li><a href="#">Donate</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2025 Aarunya Sparsha Foundation. All rights reserved. | Touching Lives, Creating Smiles ❤️</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
