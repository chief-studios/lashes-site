import React, { useEffect, useState, useRef } from 'react';
import '../styles/Intro.css';

const Intro = ({ onFinish, text = 'welcome to the beauty studio' }) => {
  const fadeIn = 400; // ms
  const charDelay = 120; // ms per character (slower)
  const typingDuration = Math.max(400, text.length * charDelay);
  const pauseAfterTyping = 600;
  const fadeOut = 600;

  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    // schedule exit after fadeIn + typing + pause
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, fadeIn + typingDuration + pauseAfterTyping);

    // schedule finish after fadeOut completes
    const finishTimer = setTimeout(() => {
      finishedRef.current = true;
      onFinish && onFinish();
    }, fadeIn + typingDuration + pauseAfterTyping + fadeOut);

    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        // start exit immediately
        if (!exiting) setExiting(true);
        // call onFinish after fadeOut
        setTimeout(() => {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish && onFinish();
          }
        }, fadeOut + 50);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onFinish, typingDuration, exiting]);

  const handleClickEnter = () => {
    if (!exiting) setExiting(true);
    setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish && onFinish();
      }
    }, fadeOut + 50);
  };

  return (
    <div
      className={`intro-overlay ${exiting ? 'intro-exit' : 'intro-active'}`}
      role="dialog"
      aria-label="Welcome"
      onClick={handleClickEnter}
    >
      <div className="intro-content">
        <h1 className="intro-title">
          <span
            className="typing"
            style={{
              animationDuration: `${typingDuration}ms`,
              animationTimingFunction: `steps(${Math.max(1, text.length)}, end)`,
            }}
            aria-hidden="true"
          >
            {text}
          </span>
        </h1>
        <p className="intro-sub">{/* empty - typing contains full text */}</p>
        <button className="intro-button" onClick={handleClickEnter} aria-label="Enter site">
          <span className="sr-only">Enter</span>
        </button>
      </div>
    </div>
  );
};

export default Intro;
