import React, { useState } from 'react';
import { TextField } from '@mui/material';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Drop-in replacement for MUI TextField that adds AI buttons underneath.
 * Accepts all the same props as TextField plus:
 *   - isDarkMode: bool
 *   - onValueChange: (newValue: string) => void  ← called when AI updates the value
 */
const AITextFieldWithButtons = ({
  name,
  value,
  onChange,
  onValueChange,
  isDarkMode = false,
  placeholder,
  fullWidth,
  inputProps,
  sx,
  multiline,
  rows,
  ...rest
}) => {
  const [isCheckingSpell, setIsCheckingSpell] = useState(false);
  const [isRephrasing, setIsRephrasing]       = useState(false);
  const [feedback, setFeedback]               = useState(null);
  const [prevValue, setPrevValue]             = useState(null);

  const hasText = value && value.trim().length > 0;
  const busy    = isCheckingSpell || isRephrasing;

  const notify = (newValue) => {
    // Call both the original onChange (so formData updates) and onValueChange
    if (onChange) {
      // Simulate a synthetic event so handleChange(e) still works
      onChange({ target: { name, value: newValue } });
    }
    if (onValueChange) onValueChange(newValue);
  };

  // ── Fix Spelling ──────────────────────────────────────────────────────────
  const handleSpellCorrect = async () => {
    if (!hasText || busy) return;
    setIsCheckingSpell(true);
    setFeedback(null);
    setPrevValue(value);
    try {
      const res  = await fetch(`${API_BASE}/api/ai/spell-correct`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const corrected = data.corrected || data.rephrased || value;
      if (corrected !== value) {
        notify(corrected);
        setFeedback({ type: 'spell', msg: '✅ Spelling & grammar corrected!' });
      } else {
        setPrevValue(null);
        setFeedback({ type: 'nochange', msg: '✅ No spelling errors found!' });
      }
    } catch (err) {
      setPrevValue(null);
      setFeedback({ type: 'error', msg: `❌ Spell check failed: ${err.message}` });
    } finally {
      setIsCheckingSpell(false);
    }
  };

  // ── Rephrase to Formal ────────────────────────────────────────────────────
  const handleRephrase = async () => {
    if (!hasText || busy) return;
    setIsRephrasing(true);
    setFeedback(null);
    setPrevValue(value);
    try {
      const res  = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      const rephrased = data.rephrased || data.rephrasedText || value;
      notify(rephrased);
      setFeedback({ type: 'rephrase', msg: '✅ Rephrased to formal style!' });
    } catch (err) {
      setPrevValue(null);
      setFeedback({ type: 'error', msg: `❌ Rephrase failed: ${err.message}` });
    } finally {
      setIsRephrasing(false);
    }
  };

  // ── Undo ──────────────────────────────────────────────────────────────────
  const handleUndo = () => {
    if (prevValue !== null) {
      notify(prevValue);
      setPrevValue(null);
      setFeedback(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* MUI TextField — identical to original */}
      <TextField
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        inputProps={{ ...inputProps, style: { color: isDarkMode ? 'white' : 'inherit', ...(inputProps?.style || {}) } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
            },
          },
          ...sx,
        }}
        {...rest}
      />

      {/* AI Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSpellCorrect}
          disabled={busy || !hasText}
          title={hasText ? 'Fix spelling & grammar — keeps your wording' : 'Type something first'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 6, border: 'none',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            cursor: (busy || !hasText) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            background: isCheckingSpell ? '#bfdbfe'
              : hasText ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#d1d5db',
            color: hasText ? '#fff' : '#6b7280',
            boxShadow: hasText && !busy ? '0 2px 6px rgba(59,130,246,0.35)' : 'none',
          }}
        >
          {isCheckingSpell ? '⏳ Checking...' : '🔤 Fix Spelling'}
        </button>

        <button
          type="button"
          onClick={handleRephrase}
          disabled={busy || !hasText}
          title={hasText ? 'Rewrite in formal professional language' : 'Type something first'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 6, border: 'none',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            cursor: (busy || !hasText) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            background: isRephrasing ? '#ddd6fe'
              : hasText ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : '#d1d5db',
            color: hasText ? '#fff' : '#6b7280',
            boxShadow: hasText && !busy ? '0 2px 6px rgba(139,92,246,0.35)' : 'none',
          }}
        >
          {isRephrasing ? '⏳ Rephrasing...' : '✨ Rephrase to Formal'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 6, fontSize: 13,
          ...(feedback.type === 'spell'    ? { background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46' } :
             feedback.type === 'rephrase' ? { background: '#ede9fe', border: '1px solid #c4b5fd', color: '#4c1d95' } :
             feedback.type === 'nochange' ? { background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af' } :
                                            { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }),
        }}>
          <span style={{ flex: 1 }}>{feedback.msg}</span>
          {prevValue !== null && feedback.type !== 'error' && feedback.type !== 'nochange' && (
            <button
              type="button" onClick={handleUndo}
              style={{ background: 'none', border: '1px solid currentColor', borderRadius: 4,
                padding: '2px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'inherit' }}
            >
              ↩ Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AITextFieldWithButtons;