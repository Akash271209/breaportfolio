import { useEffect, useRef, useState } from "react";

function CustomCursor() {
  const cursorRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.body.classList.add("custom-cursor-enabled");

    let frame = null;
    const move = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        if (cursorRef.current) {
          cursorRef.current.style.left = e.clientX + "px";
          cursorRef.current.style.top = e.clientY + "px";
        }
        frame = null;
      });
    };

    const onOver = (e) => {
      if (e.target.closest("a, button")) setHovering(true);
    };
    const onOut = (e) => {
      if (e.target.closest("a, button")) setHovering(false);
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.body.classList.remove("custom-cursor-enabled");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  if (!enabled) return null;

  return <div ref={cursorRef} className={`custom-cursor${hovering ? " hovering" : ""}`} />;
}

export default CustomCursor;
