import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaInstagram } from "react-icons/fa"; // Instagram icon
import "../styles/styles.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <NavLink to="/gallery" className="nav-link-logo" onClick={() => setMenuOpen(false)}>
          Brea Freeburn
        </NavLink>
      </div>

      <div className={menuOpen ? "nav-links open" : "nav-links"}>
        <NavLink
          to="/gallery"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMenuOpen(false)}
        >
          Gallery
        </NavLink>
        <NavLink
          to="/bio"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMenuOpen(false)}
        >
          Bio
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMenuOpen(false)}
        >
          Contact
        </NavLink>

        {/* Instagram Icon */}
        <a
          href="https://www.instagram.com/brea_freeburn/"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-icon"
          aria-label="Instagram"
          onClick={() => setMenuOpen(false)}
        >
          <FaInstagram />
        </a>
      </div>
      <button
  className={menuOpen ? "nav-hamburger open" : "nav-hamburger"}
  onClick={() => setMenuOpen(!menuOpen)}
  aria-label="Toggle menu"
>
  <span></span>
  <span></span>
  <span></span>
</button>
    </nav>
  );
}

export default Navbar;

