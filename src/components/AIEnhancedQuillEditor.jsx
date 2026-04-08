import { useState, useCallback, useEffect, useRef } from 'react';
import QuillEditor from './QuillEditor';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Formatting Helpers ───────────────────────────────────────────────────────

// Convert **bold** and *italic* markdown to HTML inline
const applyInlineMarkdown = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

const formatPlainText = (text) => {
  if (!text || !text.trim()) return '';
  const lines = text.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) { closeLists(); return; }
    if (trimmed.length < 60 && (trimmed.endsWith(':') || trimmed === trimmed.toUpperCase())) {
      closeLists(); html += `<h3>${applyInlineMarkdown(trimmed)}</h3>`; return;
    }
    if (/^[\*\-\u2022\u00b7]\s+/.test(trimmed)) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      const content = trimmed.replace(/^[\*\-\u2022\u00b7]\s+/, '');
      html += `<li>${applyInlineMarkdown(content)}</li>`; return;
    }
    if (/^\d+[\.]\s+/.test(trimmed)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      const content = trimmed.replace(/^\d+[\.]\s+/, '');
      html += `<li>${applyInlineMarkdown(content)}</li>`; return;
    }
    closeLists();
    html += `<p>${applyInlineMarkdown(trimmed)}</p>`;
  });
  closeLists();
  return html;
};

const htmlToPlainText = (html) =>
  (html || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

const toPlainBullets = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => `* ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => {
      if (Array.isArray(v)) return `${k}:\n` + v.map(i => `* ${i}`).join('\n');
      return `* ${v}`;
    }).join('\n');
  }
  return String(val);
};

// ─── Generate Modal ───────────────────────────────────────────────────────────

function GenerateModal({ isOpen, onClose, onGenerate, isGenerating, jobTitle }) {
  const [promptText, setPromptText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPromptText(jobTitle
        ? `Write a professional job description for ${jobTitle}. Include job summary, roles and responsibilities, required skills, benefits, recruitment process, and eligibility.`
        : '');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, jobTitle]);

  const submitPrompt = () => {
    if (promptText.trim()) onGenerate(promptText.trim());
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submitPrompt(); }
    if (e.key === 'Escape' && !isGenerating) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">&#129302;</span>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Generate JD with AI</h3>
              <p className="text-purple-200 text-xs">All form fields will be auto-filled</p>
            </div>
          </div>
          <button onClick={() => !isGenerating && onClose()}
            className="text-white/70 hover:text-white text-xl font-bold">&times;</button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* Prompt textarea */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe the job you want to create:
          </label>
          <textarea
            ref={textareaRef}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder={`Examples:\n\u2022 Senior Java Developer with Spring Boot\n\u2022 Data Scientist at a fintech company\n\u2022 DevOps Engineer focused on AWS`}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-purple-400 transition-colors"
            style={{ minHeight: '110px' }}
          />
          <p className="text-xs text-gray-400 mt-1">
            Press <kbd className="bg-gray-100 px-1 py-0.5 rounded text-xs">Ctrl+Enter</kbd> to generate
          </p>

          {/* Quick prompts */}
          {jobTitle && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  `Standard JD for ${jobTitle}`,
                  `Senior ${jobTitle} with 5+ years`,
                  `Entry-level ${jobTitle} for freshers`,
                ].map((s) => (
                  <button key={s} type="button" onClick={() => setPromptText(s)}
                    className="text-xs px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full hover:bg-purple-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">&#128203; Fields that will be auto-filled:</p>
            <p className="text-xs text-blue-600">
              Job Description &bull; Responsibilities &bull; Skills &bull; Eligibility &bull; Benefits &bull; Recruitment Process
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={() => !isGenerating && onClose()} disabled={isGenerating}
            className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={submitPrompt} disabled={isGenerating || !promptText.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {isGenerating
              ? <><span className="inline-block animate-spin">&#9203;</span><span>Generating all fields...</span></>
              : <><span>&#10024;</span><span>Generate &amp; Fill All Fields</span></>}
          </button>
        </div>

      </div>
    </div>
  );
}

GenerateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool.isRequired,
  jobTitle: PropTypes.string,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIEnhancedQuillEditor({
  value, onChange, isDarkMode, placeholder, label,
  showRephraseButton = true, showGenerateButton = false,
  fieldName, jobTitle, skills, onSectionsGenerated,
  externalModalOpen, onExternalModalClose,
}) {
  const [suggestions, setSuggestions]         = useState([]);
  const [isRephrasing, setIsRephrasing]       = useState(false);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalOpen, setModalOpen]             = useState(false);
  const isPastingRef                          = useRef(false);
  const wrapperRef                            = useRef(null);

  const isModalOpen = modalOpen || externalModalOpen || false;

  const closeModal = useCallback(() => {
    setModalOpen(false);
    onExternalModalClose?.();
  }, [onExternalModalClose]);

  // ── Paste handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') isPastingRef.current = true;
    };
    wrapper.addEventListener('keydown', onKeyDown);
    return () => wrapper.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleChange = useCallback((newValue) => {
    if (!isPastingRef.current) { onChange(newValue); return; }
    isPastingRef.current = false;
    const plain = htmlToPlainText(newValue);
    const hasStructure  = /[\n\r]/.test(plain) && /^[\*\-\u2022]|\d+[\.]/m.test(plain);
    const lostStructure = !/<(ul|ol|li|h[1-6])/i.test(newValue);
    onChange(hasStructure && lostStructure ? formatPlainText(plain) : newValue);
  }, [onChange]);

  // ── Real-time issue detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!value || value.length < 10) { setSuggestions([]); setShowSuggestions(false); return; }
    const timer = setTimeout(async () => {
      try {
        const plainText = value.replace(/<[^>]*>/g, '');
        const apiResp = await fetch(`${API_BASE}/api/ai/suggest`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: plainText }),
        });
        if (apiResp.ok) {
          const apiData = await apiResp.json();
          setSuggestions(apiData.suggestions || []);
          setShowSuggestions(apiData.hasIssues || false);
        }
      } catch (err) { console.error('Suggestion check failed:', err); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [value]);

  // ── Generate JD ─────────────────────────────���──────────────────────────────
  const handleGenerate = useCallback(async (userPrompt) => {
    setIsGenerating(true);
    try {
      const generateResp = await fetch(`${API_BASE}/api/ai/generate-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:   userPrompt,
          jobTitle: jobTitle || '',
          skills:   skills   || '',
        }),
      });

      if (!generateResp.ok) {
        const errData = await generateResp.json().catch(() => ({}));
        alert(`Generation failed: ${errData.error || generateResp.statusText}`);
        return;
      }

      const generateData = await generateResp.json();

      if (generateData.sections && onSectionsGenerated) {
        const s = generateData.sections;
        const filled = {
          jobDescription:     formatPlainText(toPlainBullets(s.jobDescription)),
          responsibilities:   formatPlainText(toPlainBullets(s.responsibilities)),
          skills:             formatPlainText(toPlainBullets(s.skills)),
          eligibility:        formatPlainText(toPlainBullets(s.eligibility)),
          benefits:           formatPlainText(toPlainBullets(s.benefits)),
          recruitmentProcess: formatPlainText(toPlainBullets(s.recruitmentProcess)),
        };
        onSectionsGenerated(filled);
        closeModal();
      } else if (generateData.generated) {
        onChange(formatPlainText(toPlainBullets(generateData.generated)));
        closeModal();
      } else {
        alert('No content generated. Please try again.');
      }

      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error('Generate error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [jobTitle, skills, onChange, onSectionsGenerated, closeModal]);

  // ── Fix & Formalize ────────────────────────────────────────────────────────
  const handleRephrase = useCallback(async () => {
    if (!value || isRephrasing) return;
    setIsRephrasing(true);
    try {
      const rephraseResp = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: htmlToPlainText(value) }),
      });
      if (!rephraseResp.ok) { alert(`Rephrase failed: ${rephraseResp.status}`); return; }
      const rephraseData = await rephraseResp.json();
      if (rephraseData.rephrased) {
        onChange(formatPlainText(rephraseData.rephrased));
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsRephrasing(false);
    }
  }, [value, onChange, isRephrasing]);

  const hasIssues    = suggestions.length > 0;
  const isProcessing = isRephrasing || isGenerating;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <GenerateModal
        isOpen={isModalOpen}
        onClose={() => !isGenerating && closeModal()}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        jobTitle={jobTitle}
      />

      <div className="mb-4" data-field={fieldName}>

        {(label || showGenerateButton) && (
          <div className="flex items-center justify-between mb-2">
            {label && <label className="block text-sm font-medium">{label}</label>}
            {showGenerateButton && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <span>&#129302;</span><span>Generate with AI</span>
              </button>
            )}
          </div>
        )}

        {/* Editor */}
        <div ref={wrapperRef}
          className={`relative rounded-lg overflow-hidden ${hasIssues ? 'ring-2 ring-yellow-400' : ''}`}>
          <QuillEditor value={value} onChange={handleChange}
            isDarkMode={isDarkMode} placeholder={placeholder} />
        </div>

        {/* Issue banner */}
        {showSuggestions && (
          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-yellow-800 font-medium">
              &#128221; {suggestions.length} issue{suggestions.length > 1 ? 's' : ''} detected
            </p>
            <button type="button" onClick={() => setShowSuggestions(false)}
              className="ml-3 text-yellow-500 hover:text-yellow-700 text-xs">&times;</button>
          </div>
        )}

        {/* Fix & Formalize */}
        {showRephraseButton && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleRephrase}
              disabled={isProcessing || !value}
              className={`px-5 py-2 rounded-lg font-medium text-white text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg
                ${isRephrasing
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRephrasing
                ? <><span className="animate-spin">&#9203;</span><span>AI Processing...</span></>
                : <><span>&#10024;</span><span>Fix &amp; Formalize with AI</span></>}
            </button>
            {hasIssues && !isProcessing && (
              <p className="mt-1 text-xs text-yellow-600">
                &#128221; {suggestions.length} issue{suggestions.length > 1 ? 's' : ''} &mdash; click to fix
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

AIEnhancedQuillEditor.propTypes = {
  value: PropTypes.string, onChange: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool, placeholder: PropTypes.string, label: PropTypes.string,
  showRephraseButton: PropTypes.bool, showGenerateButton: PropTypes.bool,
  fieldName: PropTypes.string, jobTitle: PropTypes.string, skills: PropTypes.string,
  onSectionsGenerated: PropTypes.func,
  externalModalOpen: PropTypes.bool,
  onExternalModalClose: PropTypes.func,
};

export function useAIRephrase() {
  const [loading, setLoading] = useState(false);
  const rephrase = useCallback(async (text) => {
    setLoading(true);
    try {
      const rephraseResp = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!rephraseResp.ok) throw new Error(`HTTP ${rephraseResp.status}`);
      const rephraseData = await rephraseResp.json();
      return rephraseData.rephrased || text;
    } catch (err) { throw err; }
    finally { setLoading(false); }
  }, []);
  return { rephrase, loading };
}