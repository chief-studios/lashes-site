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
    const [isMobile, setIsMobile] = useState(false);
    const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= 600);
      onResize();
      window.addEventListener('resize', onResize);

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

      // Non-mobile flow: schedule exit/finish based on computed durations
      if (!isMobile) {
          const exitTimer = setTimeout(() => setExiting(true), fadeIn + typingDuration + pauseAfterTyping);
          const finishTimer = setTimeout(() => {
              finishedRef.current = true;
              onFinish && onFinish();
          }, fadeIn + typingDuration + pauseAfterTyping + fadeOut);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(finishTimer);
            window.removeEventListener('keydown', handleKey);
          window.removeEventListener('resize', onResize);
      };
      }

      // For mobile we'll let a separate effect handle typing and finish
      return () => {
          window.removeEventListener('keydown', handleKey);
          window.removeEventListener('resize', onResize);
      };
  }, [onFinish, typingDuration, exiting, isMobile]);

  const handleClickEnter = () => {
    if (!exiting) setExiting(true);
    setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish && onFinish();
      }
    }, fadeOut + 50);
  };

    // Mobile typing effect: reveal characters one-by-one but allow wrapping
    useEffect(() => {
        if (!isMobile) return undefined;
        setDisplayedText('');
        let idx = 0;
        let ti = null;
        ti = setInterval(() => {
            idx += 1;
            setDisplayedText(text.slice(0, idx));
            if (idx >= text.length) {
                clearInterval(ti);
                // after typing complete, pause then exit
                setTimeout(() => setExiting(true), pauseAfterTyping);
                setTimeout(() => {
                    finishedRef.current = true;
                    onFinish && onFinish();
                }, pauseAfterTyping + fadeOut);
            }
        }, charDelay);

        return () => {
            if (ti) clearInterval(ti);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);

  return (
    <div
      className={`intro-overlay ${exiting ? 'intro-exit' : 'intro-active'}`}
      role="dialog"
      aria-label="Welcome"
      onClick={handleClickEnter}
    >
      <div className="intro-content">
        <h1 className="intro-title">
                  {isMobile ? (
                      <span className={`typing typing-mobile`} aria-hidden="true">{displayedText}</span>
                  ) : (
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
                  )}
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
