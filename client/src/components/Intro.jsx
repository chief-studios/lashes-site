import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/Intro.css';

const Intro = ({ onFinish, text = 'WELCOME TO BEST LASHES' }) => {
  const fadeIn = 400; // ms
  const charDelay = 120; // ms per character (slower)
  const typingDuration = Math.max(400, text.length * charDelay);
  const pauseAfterTyping = 600;
  const fadeOut = 600;

  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);
    const previousOverflowRef = useRef(null);
    // restore scrolling and notify parent (stable callbacks)
    const restoreOverflow = useCallback(() => {
        try { document.body.style.overflow = previousOverflowRef.current || ''; } catch { /* ignore */ }
    }, []);

    const finishAndRestore = useCallback(() => {
        if (!finishedRef.current) {
            finishedRef.current = true;
            restoreOverflow();
            onFinish && onFinish();
        }
    }, [restoreOverflow, onFinish]);
    const [isMobile, setIsMobile] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [forceWrap, setForceWrap] = useState(false);
    const measureRef = useRef(null);

  useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= 600);
      onResize();
      window.addEventListener('resize', onResize);
      // disable page scrolling while intro is active (remember previous value)
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // use the component-scoped finishAndRestore / restoreOverflow helpers

    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        // start exit immediately
        if (!exiting) setExiting(true);
          // call onFinish after fadeOut (restore overflow first)
          setTimeout(() => finishAndRestore(), fadeOut + 50);
      }
    }; 

    window.addEventListener('keydown', handleKey)

      // Desktop (non-wrapping) flow: schedule exit/finish based on computed durations
      // If we are forcing wrap (e.g. tablet where text would overflow), skip this and let the mobile/JS flow handle it.
      if (!(isMobile || forceWrap)) {
          const exitTimer = setTimeout(() => setExiting(true), fadeIn + typingDuration + pauseAfterTyping);
          const finishTimer = setTimeout(() => {
              finishAndRestore();
          }, fadeIn + typingDuration + pauseAfterTyping + fadeOut);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(finishTimer);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('resize', onResize);
        // restore overflow on this cleanup path too
        restoreOverflow();
        };
    }

      // For mobile we'll let a separate effect handle typing and finish
      return () => {
        // restore page scrolling
        restoreOverflow();
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('resize', onResize);
    };
  }, [onFinish, typingDuration, exiting, isMobile, forceWrap, finishAndRestore, restoreOverflow]);

    // measure the natural width of the text and force wrapping when it would run into the viewport edges
    useEffect(() => {
        const checkMeasure = () => {
            try {
                const margin = 40; // px of horizontal breathing room
                const available = window.innerWidth - margin;
                if (measureRef.current) {
                    const w = measureRef.current.getBoundingClientRect().width;
                    setForceWrap(w > available);
                }
            } catch {
                // ignore measurement errors
            }
        };
        checkMeasure();
        window.addEventListener('resize', checkMeasure);
        return () => window.removeEventListener('resize', checkMeasure);
    }, [text]);

  const handleClickEnter = () => {
    if (!exiting) setExiting(true);
      setTimeout(() => finishAndRestore(), fadeOut + 50);
  };

    // Mobile/forced-wrap typing effect: reveal characters one-by-one and allow wrapping
    useEffect(() => {
        if (!(isMobile || forceWrap)) return undefined;
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
              finishAndRestore();
          }, pauseAfterTyping + fadeOut);
          }
      }, charDelay);

        return () => {
            if (ti) clearInterval(ti);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, forceWrap]);

  return (
    <div
      className={`intro-overlay ${exiting ? 'intro-exit' : 'intro-active'}`}
      role="dialog"
      aria-label="Welcome"
      onClick={handleClickEnter}
    >
      <div className="intro-content">
              <h1 className="intro-title">
                  {(isMobile || forceWrap) ? (
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
              {/* hidden measuring element for determining if text will overflow horizontally */}
              <span ref={measureRef} className="typing typing-measure" style={{ position: 'absolute', visibility: 'hidden', left: -9999, whiteSpace: 'nowrap' }} aria-hidden="true">{text}</span>
        <p className="intro-sub">{/* empty - typing contains full text */}</p>
        <button className="intro-button" onClick={handleClickEnter} aria-label="Enter site">
          <span className="sr-only">Enter</span>
        </button>
      </div>
    </div>
  );
};

export default Intro;
