import { useState, useEffect } from "react";
import "../styles/styles.css";

const artworks = [
  {
    title: "Interior Pulse",
    year: "2026",
    medium: "Putty, PLA Plastic and Airbrushed acrylic",
    dimensions: "67 × 46 cm",
    image: "/heart-exoskeleton-new.jpg"
  },
  {
    title: "Breathing Field I",
    year: "2026",
    medium: "Canvas",
    dimensions: "16 × 19 cm",
    description: "Marble Dust, acrylic and Clay.",
    image: "/breathing-field-1.jpg",
    images: ["/breathing-field-1.jpg", "/breathing-series-3.jpg", "/breathing-series-4.jpg"]
  },
  {
    title: "Threshold",
    year: "2026",
    medium: "Canvas",
    dimensions: "16 × 16 cm",
    description: "Marble Dust, acrylic and Clay.",
    image: "/threshold-main.jpeg",
    images: ["/threshold-main.jpeg", "/threshold-2026-2.jpg"]
  },
  {
    title: "Breathing Series",
    year: "2026",
    medium: "Marble Dust, acrylic and Clay",
    dimensions: "16 × 19 cm",
    description: "A series of works exploring painting as a spatial and material structure rather than a flat image.",
    image: "/breathing-field-1-alt.jpg",
    images: ["/breathing-field-1-alt.jpg", "/breathing-field-2.jpg"]
  },
  {
    title: "Bone Series",
    year: "2026",
    medium: "Acrylic, marble dust, air-drying clay and modelling paste on canvas",
    dimensions: "16 × 16 cm",
    image: "/bone-series-3.jpg",
    images: ["/bone-series-3.jpg", "/breathing-field-diptych.jpg", "/bone-series-2.jpeg"]
  }
];

function Gallery() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", !!selected);
    return () => document.body.classList.remove("no-scroll");
  }, [selected]);

  const featured = {
    title: "Breathing Field II",
    year: "2026",
    image: "/breathing-field-2.jpg"
  };
  const gridItems = artworks;

  return (
    <div className="work-page">
      <section className="work-hero">
        <div className="work-hero-text">
          <div className="work-hero-intro">
            <h1>Painting as space.</h1>
            <p className="work-hero-description">
              Exploring the thresholds between painting, architecture and embodied experience.
            </p>
            <a href="#work-grid" className="view-work-link">View Work →</a>
          </div>
          <p className="work-hero-caption">{featured.title}, {featured.year}</p>
        </div>
        <div className="work-hero-image">
          <img src={featured.image} alt={featured.title} loading="eager" fetchPriority="high" />
        </div>
      </section>

      <section className="work-grid" id="work-grid">
        {gridItems.map((art, i) => (
          <div className="work-card" key={i}>
            <button className="work-card-image" onClick={() => setSelected(art)}>
              <img src={art.image} alt={art.title} loading="lazy" />
            </button>
            <h2 className="work-card-title">{art.title}</h2>
            <p className="work-card-year">{art.year}</p>
            <button className="view-project-link" onClick={() => setSelected(art)}>View Project →</button>
          </div>
        ))}
      </section>

      <section className="work-quote">
        <p>"The house shelters day-dreaming, the house protects the dreamer, the house allows one to dream in peace."</p>
        <span>— Gaston Bachelard, The Poetics of Space</span>
      </section>

      <footer className="site-footer">
        <p>© 2026 Brea Freeburn</p>
        <a href="https://www.instagram.com/brea_freeburn/" target="_blank" rel="noopener noreferrer">Instagram</a>
      </footer>

      {selected && (
        <div className="lightbox-overlay" onClick={() => setSelected(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            {selected.images && selected.images.length > 1 ? (
              <div className="lightbox-image-group">
                {selected.images.map((img, i) => (
                  <img key={i} src={img} alt={`${selected.title} ${i + 1}`} className="lightbox-image" />
                ))}
              </div>
            ) : (
              <img src={selected.image} alt={selected.title} className="lightbox-image" />
            )}
            <div className="lightbox-info">
              <h3>{selected.title}</h3>
              <p className="lightbox-meta">{selected.year} · {selected.medium}</p>
              <p className="lightbox-meta">{selected.dimensions}</p>
              {selected.description && <p className="lightbox-description">{selected.description}</p>}
              <a
                href={`mailto:Bfreeburn820@gmail.com?subject=${encodeURIComponent(`Enquiry about "${selected.title}"`)}&body=${encodeURIComponent(`Hi Brea,\n\nI'd like to enquire about "${selected.title}" (${selected.year}).\n\n`)}`}
                className="enquire-btn"
              >
                {selected.images && selected.images.length > 1 ? "Enquire about these Pieces" : "Enquire about this piece"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
