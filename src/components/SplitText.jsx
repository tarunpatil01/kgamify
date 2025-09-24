import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger (no SplitText plugin dependency)
if (!gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

const SplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'h1',
  onLetterAnimationComplete,
  scroll = true,
  charClassName = ''
}) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts?.status === 'loaded') setFontsLoaded(true);
    else if (document.fonts) document.fonts.ready.then(() => setFontsLoaded(true));
    else setFontsLoaded(true);
  }, []);

  // Manual split/animation without GSAP SplitText plugin
  useLayoutEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    const container = ref.current;
    const chars = Array.from(container.querySelectorAll('.split-char'));
    if (chars.length === 0) return; // nothing to animate

    // Prepare start state
  gsap.set(chars, from);

    const base = {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      onComplete: () => onLetterAnimationComplete?.(),
      willChange: 'transform, opacity'
    };

    if (scroll) {
      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign = marginValue === 0 ? '' : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;
      base.scrollTrigger = { trigger: container, start, once: true };
    }

  const animation = gsap.to(chars, base);

    return () => {
      animation?.kill();
    };
  }, [text, delay, duration, ease, from, to, threshold, rootMargin, fontsLoaded, onLetterAnimationComplete, scroll]);

  const Tag = tag || 'h1';
  const renderNodes = () => {
    if (!text) return null;
    if (splitType === 'words') {
      return text.split(/(\s+)/).map((w, i) => (
        <span key={i} className={/\s+/.test(w) ? '' : `split-char inline-block align-baseline ${charClassName}`}>{w === ' ' ? '\u00A0' : w}</span>
      ));
    }
    return text.split('').map((ch, i) => (
      <span key={i} className={ch === ' ' ? '' : `split-char inline-block align-baseline ${charClassName}`}>{ch === ' ' ? '\u00A0' : ch}</span>
    ));
  };

  return (
    <Tag
      ref={ref}
      className={`split-parent inline-block whitespace-normal ${className}`}
      style={{ textAlign, wordWrap: 'break-word' }}
    >
      {renderNodes()}
    </Tag>
  );
};

export default SplitText;

SplitText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
  delay: PropTypes.number,
  duration: PropTypes.number,
  ease: PropTypes.string,
  splitType: PropTypes.string,
  from: PropTypes.object,
  to: PropTypes.object,
  threshold: PropTypes.number,
  rootMargin: PropTypes.string,
  textAlign: PropTypes.string,
  tag: PropTypes.string,
  onLetterAnimationComplete: PropTypes.func,
  scroll: PropTypes.bool,
  charClassName: PropTypes.string
};
