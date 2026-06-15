import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import CustomCursor from "./components/CustomCursor";

const Gallery = lazy(() => import("./pages/Gallery"));
const Bio = lazy(() => import("./pages/Bio"));
const Contact = lazy(() => import("./pages/Contact"));

function LoadingScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1200);
    const t2 = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`loading-screen${fading ? " fading" : ""}`}>
      <span className="loading-screen-text">Brea Freeburn</span>
    </div>
  );
}

function PageWrapper({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    window.scrollTo(0, 0);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className={`page-wrapper${visible ? " visible" : ""}`}>
      {children}
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const handleLoaded = useCallback(() => setLoading(false), []);

  return (
    <>
      {loading && <LoadingScreen onDone={handleLoaded} />}
      <Router>
        <CustomCursor />
        <Navbar />
        <PageWrapper>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Bio />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/bio" element={<Bio />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </PageWrapper>
      </Router>
    </>
  );
}

export default App;
