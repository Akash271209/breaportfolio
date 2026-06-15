import { useEffect } from 'react';
import "../styles/styles.css";

function Bio() {

  useEffect(() => {
    const sections = document.querySelectorAll('.bio-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="bio-page">
      <div className="bio-portrait">
        <img
          src="/Brea-portrait-main.jpeg"
          alt="Brea Freeburn Portrait"
          className="bio-portrait-img"
          loading="eager"
          fetchPriority="high"
        />
        <p className="bio-portrait-caption">
          Brea Freeburn with Breathing Field I, Royal College of Art Painting Studios, London, 2026. Photograph by Eddie McLean-Kaye.
        </p>
      </div>

      {/* Content Sections - Landscape layout */}
      <div className="bio-content">
        <section className="bio-section biography">
          <h2>Bio</h2>
          <div className="bio-section-content">
            <div className="biography-layout">
              <div className="bio-text">
              <p>
                Brea Freeburn (b. 2000, IE/GB) is a London based painter
                currently completing an MA in Painting at the Royal College of Art.
                Supported by the Leverhulme Arts Scholarship.
              </p>
              <p>
               She is a material led painter, her practice approaches painting as a spatial and material construction rather than a flat image.
               Working with acrylic, marble dust, modelling paste and clay,
               Freeburn builds relief surfaces that operate between painting and architecture.
               Arches and structural frameworks recur throughout her work,
               proposing interior spaces shaped through density, restraint and tonal modulation.
              </p>
              <p>
                Influenced by sacred and architectural environments encountered in Venice,
                Rome and Barcelona, her paintings examine how built form regulates atmosphere and perception.
                Through controlled material processes,
                she constructs surfaces that suggest containment, interiority and quiet psychological presence.
              </p>
              </div>
              <div className="bio-portrait-secondary">
                <img
                  src="/Brea.jpeg"
                  alt="Brea Freeburn"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bio-section education">
          <h2>Education</h2>
          <ul className="bio-section-content">
            <li>2026 – MA Painting, Royal College of Art, London</li>
            <li>2025 – PGCE with Merit, Art and Design (Secondary), Liverpool Hope University</li>
            <li>2022 – First Class BA (Hons) Fine Art Painting, Belfast School of Art, Belfast</li>
          </ul>
        </section>

        <section className="bio-section awards">
          <h2>Awards</h2>
          <ul className="bio-section-content">
            <li>2025 – Leverhulme Scholarship Award for Academic Excellence</li>
            <li>2018–2017 – Top National Marks, Joint First Performer in Northern Ireland for GCSE and A-Level Art and Design</li>
            <li>2018 – Sacred Heart Grammar School, Top Performer in Art and Design</li>
          </ul>
        </section>

        <section className="bio-section exhibitions">
          <h2>Selected Exhibitions</h2>
          <ul className="bio-section-content">
            <li>2026 – RCA Degree Show, Royal College of Art, London</li>
            <li>2026 – Wand in My Hand, Gallery 1, The Handbag Factory, London</li>
            <li>2026 – Existing in the Threshold (CACHE RCA Alumni Exhibition), The Rose, Battersea, London</li>
            <li>2026 – Huge Gallery Exhibition, The Factory, London</li>
            <li>
              <a
                href="https://drive.google.com/your-2025-gallery-link"
                target="_blank" 
                rel="noopener noreferrer"
                className="exhibition-link"
              >
                2025 – Liverpool Hope University Campus Student Outcomes Summer Gallery
              </a>
            </li>
            <li>
              <a 
                href="https://drive.google.com/your-2023-gallery-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exhibition-link"
              >
                2023 – Emergence VI, Queen's Street Studios, Belfast
              </a>
            </li>
            <li>
              <a 
                href="https://drive.google.com/your-2022-degree-show-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exhibition-link"
              >
                2022 – Degree Show, Ulster University, Belfast
              </a>
            </li>
            <li>
              <a 
                href="https://drive.google.com/your-2022-liquid-arsenal-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exhibition-link"
              >
                2022 – Liquid Arsenal, M.A.D.S. Art Gallery, Milan
              </a>
            </li>
          </ul>
        </section>

        <section className="bio-section interviews">
          <h2>Interviews</h2>
          <ul className="bio-section-content">
            <li>
              2024 – Art By Artists:{" "}
              <a 
                href="https://youtu.be/kPWpf3qG45w?si=vMCizN9PAuI_lczn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exhibition-link"
              >
                Interview on Practice
              </a>
            </li>
          </ul>
        </section>

        <footer className="bio-footer">
          <p>© 2026 Brea Freeburn</p>
        </footer>
      </div>

    <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>

    </main>
  );
}

export default Bio;