import { useState } from 'react';
import "../styles/styles.css";

const EMAIL = 'Bfreeburn820@gmail.com';
const INSTAGRAM_HANDLE = '@brea_freeburn';
const INSTAGRAM_URL = 'https://www.instagram.com/brea_freeburn/';

const Contact = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(EMAIL)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="contact-page">
      <div className="contact-inner">
        <div className="contact-header">
          <p className="contact-eyebrow">Get in touch</p>
          <h1 className="contact-title">Brea Freeburn</h1>
          <p className="contact-subtitle">
            Open to exhibition proposals, commissions, collaborations and press enquiries.
          </p>
        </div>

        <div className="contact-divider"></div>

        <div className="contact-methods">
          <div className="contact-method">
            <span className="contact-method-label">Email</span>
            <div className="contact-method-content">
              <a href={"mailto:" + EMAIL} className="contact-link">
                {EMAIL}
              </a>
              <button
                className={copied ? 'copy-btn copied' : 'copy-btn'}
                onClick={handleCopyEmail}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="contact-method">
            <span className="contact-method-label">Instagram</span>
            <div className="contact-method-content">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="contact-link">
                {INSTAGRAM_HANDLE}
              </a>
            </div>
          </div>

          <div className="contact-method">
            <span className="contact-method-label">Based in</span>
            <div className="contact-method-content">
              <span className="contact-plain">London, United Kingdom</span>
            </div>
          </div>

          <div className="contact-method">
            <span className="contact-method-label">Studio</span>
            <div className="contact-method-content">
              <span className="contact-plain">Royal College of Art, London</span>
            </div>
          </div>
        </div>

        <div className="contact-divider"></div>

        <p className="contact-note">
          Response time is typically within 48 hours. For urgent press enquiries, please state in the subject line.
        </p>
      </div>
      <footer className="site-footer">
        <p>© 2026 Brea Freeburn</p>
        <a href="https://www.instagram.com/brea_freeburn/" target="_blank" rel="noopener noreferrer">Instagram</a>
      </footer>

    </div>
  );
};

export default Contact;