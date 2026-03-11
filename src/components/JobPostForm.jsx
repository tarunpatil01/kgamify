import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function JobPostForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    skills: "",
    benefits: "",
    eligibility: "",
    relocationBenefits: "",
    recruitmentProcess: "",
    companyDescription: "",
    additionalInfo: "",
    location: "",
    salary: "",
  });

  const [verification, setVerification] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rephrasing, setRephrasing] = useState({});
  const [spellChecking, setSpellChecking] = useState({});
  const [success, setSuccess] = useState("");
  const [suggestions, setSuggestions] = useState({});
  const [fieldFeedback, setFieldFeedback] = useState({});

  // Real-time suggestions (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.entries(formData).forEach(([field, value]) => {
        if (value && value.length > 10) {
          checkSuggestions(field, value);
        }
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const checkSuggestions = async (field, text) => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, field }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestions.length > 0) {
          setSuggestions((prev) => ({ ...prev, [field]: data.suggestions }));
        } else {
          setSuggestions((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Suggestion error:", err);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setVerification(null);
    // Clear feedback when user edits
    setFieldFeedback((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ── Spell Correct (fixes typos only, keeps wording) ──────────────────────
  const handleSpellCorrect = async (field) => {
    const text = formData[field];
    if (!text || !text.trim()) return;

    setSpellChecking((prev) => ({ ...prev, [field]: true }));
    setFieldFeedback((prev) => { const n = { ...prev }; delete n[field]; return n; });

    try {
      const res = await fetch(`${API_BASE}/api/ai/spell-correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Spell check failed");

      const corrected = data.corrected || data.rephrased || text;
      setFormData((prev) => ({ ...prev, [field]: corrected }));
      setSuggestions((prev) => { const n = { ...prev }; delete n[field]; return n; });
      setFieldFeedback((prev) => ({
        ...prev,
        [field]: corrected !== text
          ? { type: "spell", msg: "✅ Spelling & grammar corrected!" }
          : { type: "nochange", msg: "✅ No spelling errors found!" },
      }));
    } catch (err) {
      console.error(`Spell check error for ${field}:`, err);
      setFieldFeedback((prev) => ({
        ...prev,
        [field]: { type: "error", msg: `❌ Spell check failed: ${err.message}` },
      }));
    } finally {
      setSpellChecking((prev) => ({ ...prev, [field]: false }));
    }
  };

  // ── Rephrase to Formal (rewrites professionally) ─────────────────────────
  const handleRephraseField = async (field) => {
    const text = formData[field];
    if (!text || !text.trim()) return;

    setRephrasing((prev) => ({ ...prev, [field]: true }));
    setFieldFeedback((prev) => { const n = { ...prev }; delete n[field]; return n; });

    try {
      const res = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.message || "Rephrase failed");

      const rephrased = data.rephrased || data.rephrasedText || text;
      setFormData((prev) => ({ ...prev, [field]: rephrased }));
      setSuggestions((prev) => { const n = { ...prev }; delete n[field]; return n; });
      setFieldFeedback((prev) => ({
        ...prev,
        [field]: { type: "rephrase", msg: "✅ Rephrased to formal style!" },
      }));
    } catch (err) {
      console.error(`Rephrase error for ${field}:`, err);
      setFieldFeedback((prev) => ({
        ...prev,
        [field]: { type: "error", msg: `❌ Rephrase failed: ${err.message}` },
      }));
    } finally {
      setRephrasing((prev) => ({ ...prev, [field]: false }));
    }
  };

  // ── Rephrase ALL fields ───────────────────────────────────────────────────
  const handleRephraseAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/ai/rephrase-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fields: formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Batch rephrase failed");
      setFormData(data.rephrased);
      setSuggestions({});
      setFieldFeedback({});
      alert("✅ All fields rephrased successfully!");
    } catch (err) {
      setErrors([err.message || "Failed to rephrase all fields"]);
    } finally {
      setLoading(false);
    }
  };

  // ── Verify JD ─────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!formData.title || !formData.description) {
      setErrors(["Job title and description are required."]);
      return;
    }
    try {
      setLoading(true);
      setErrors([]);
      setVerification(null);
      const res = await fetch(`${API_BASE}/api/ai/verify-jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          responsibilities: formData.responsibilities,
          location: formData.location,
          salary: formData.salary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      setVerification(data);
      if (!data.isValid) setErrors(["Job description needs improvement. See issues below."]);
    } catch (err) {
      setErrors([err.message || "Verification failed"]);
    } finally {
      setLoading(false);
    }
  };

  // ── Post Job ──────────────────────────────────────────────────────────────
  const handlePostJob = async () => {
    if (!verification || !verification.isValid) {
      setErrors(["Please verify the job description first and fix all issues."]);
      return;
    }
    try {
      setLoading(true);
      setErrors([]);
      setSuccess("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Job posting failed");
      setSuccess("✅ Job Posted Successfully!");
      setFormData({
        title: "", description: "", requirements: "", responsibilities: "",
        skills: "", benefits: "", eligibility: "", relocationBenefits: "",
        recruitmentProcess: "", companyDescription: "", additionalInfo: "",
        location: "", salary: "",
      });
      setVerification(null);
      setSuggestions({});
      setFieldFeedback({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors([err.message || "Failed to post job"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create Job Post</h2>

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg font-semibold">
          {success}
        </div>
      )}

      {/* ── Section: Basic Info ── */}
      <SectionHeading title="📋 Basic Information" />

      <FormField
        label="Job Title *"
        value={formData.title}
        onChange={(v) => handleChange("title", v)}
        onSpellCorrect={() => handleSpellCorrect("title")}
        onRephrase={() => handleRephraseField("title")}
        spellChecking={spellChecking.title}
        rephrasing={rephrasing.title}
        suggestions={suggestions.title}
        feedback={fieldFeedback.title}
        placeholder="e.g., Senior Software Engineer"
      />

      <FormField
        label="Location"
        value={formData.location}
        onChange={(v) => handleChange("location", v)}
        onSpellCorrect={() => handleSpellCorrect("location")}
        onRephrase={() => handleRephraseField("location")}
        spellChecking={spellChecking.location}
        rephrasing={rephrasing.location}
        suggestions={suggestions.location}
        feedback={fieldFeedback.location}
        placeholder="e.g., Remote, New York, Hybrid"
      />

      <FormField
        label="Salary"
        value={formData.salary}
        onChange={(v) => handleChange("salary", v)}
        onSpellCorrect={() => handleSpellCorrect("salary")}
        onRephrase={() => handleRephraseField("salary")}
        spellChecking={spellChecking.salary}
        rephrasing={rephrasing.salary}
        suggestions={suggestions.salary}
        feedback={fieldFeedback.salary}
        placeholder="e.g., $80,000 - $120,000 or Competitive"
      />

      {/* ── Section: Job Details ── */}
      <SectionHeading title="📝 Job Details" />

      <FormTextArea
        label="Job Description *"
        value={formData.description}
        onChange={(v) => handleChange("description", v)}
        onSpellCorrect={() => handleSpellCorrect("description")}
        onRephrase={() => handleRephraseField("description")}
        spellChecking={spellChecking.description}
        rephrasing={rephrasing.description}
        suggestions={suggestions.description}
        feedback={fieldFeedback.description}
        placeholder="Describe the role, what the candidate will do..."
        rows={6}
      />

      <FormTextArea
        label="Responsibilities"
        value={formData.responsibilities}
        onChange={(v) => handleChange("responsibilities", v)}
        onSpellCorrect={() => handleSpellCorrect("responsibilities")}
        onRephrase={() => handleRephraseField("responsibilities")}
        spellChecking={spellChecking.responsibilities}
        rephrasing={rephrasing.responsibilities}
        suggestions={suggestions.responsibilities}
        feedback={fieldFeedback.responsibilities}
        placeholder="Key responsibilities and duties..."
        rows={4}
      />

      <FormTextArea
        label="Requirements"
        value={formData.requirements}
        onChange={(v) => handleChange("requirements", v)}
        onSpellCorrect={() => handleSpellCorrect("requirements")}
        onRephrase={() => handleRephraseField("requirements")}
        spellChecking={spellChecking.requirements}
        rephrasing={rephrasing.requirements}
        suggestions={suggestions.requirements}
        feedback={fieldFeedback.requirements}
        placeholder="Required skills, experience, qualifications..."
        rows={4}
      />

      <FormTextArea
        label="Skills"
        value={formData.skills}
        onChange={(v) => handleChange("skills", v)}
        onSpellCorrect={() => handleSpellCorrect("skills")}
        onRephrase={() => handleRephraseField("skills")}
        spellChecking={spellChecking.skills}
        rephrasing={rephrasing.skills}
        suggestions={suggestions.skills}
        feedback={fieldFeedback.skills}
        placeholder="Technical and soft skills required..."
        rows={3}
      />

      <FormTextArea
        label="Eligibility"
        value={formData.eligibility}
        onChange={(v) => handleChange("eligibility", v)}
        onSpellCorrect={() => handleSpellCorrect("eligibility")}
        onRephrase={() => handleRephraseField("eligibility")}
        spellChecking={spellChecking.eligibility}
        rephrasing={rephrasing.eligibility}
        suggestions={suggestions.eligibility}
        feedback={fieldFeedback.eligibility}
        placeholder="Eligibility criteria, education, certifications..."
        rows={3}
      />

      {/* ── Section: Compensation & Process ── */}
      <SectionHeading title="💼 Compensation & Process" />

      <FormTextArea
        label="Benefits"
        value={formData.benefits}
        onChange={(v) => handleChange("benefits", v)}
        onSpellCorrect={() => handleSpellCorrect("benefits")}
        onRephrase={() => handleRephraseField("benefits")}
        spellChecking={spellChecking.benefits}
        rephrasing={rephrasing.benefits}
        suggestions={suggestions.benefits}
        feedback={fieldFeedback.benefits}
        placeholder="Health insurance, PTO, equity, perks..."
        rows={3}
      />

      <FormTextArea
        label="Relocation Benefits"
        value={formData.relocationBenefits}
        onChange={(v) => handleChange("relocationBenefits", v)}
        onSpellCorrect={() => handleSpellCorrect("relocationBenefits")}
        onRephrase={() => handleRephraseField("relocationBenefits")}
        spellChecking={spellChecking.relocationBenefits}
        rephrasing={rephrasing.relocationBenefits}
        suggestions={suggestions.relocationBenefits}
        feedback={fieldFeedback.relocationBenefits}
        placeholder="Relocation package details, moving allowance..."
        rows={3}
      />

      <FormTextArea
        label="Recruitment Process"
        value={formData.recruitmentProcess}
        onChange={(v) => handleChange("recruitmentProcess", v)}
        onSpellCorrect={() => handleSpellCorrect("recruitmentProcess")}
        onRephrase={() => handleRephraseField("recruitmentProcess")}
        spellChecking={spellChecking.recruitmentProcess}
        rephrasing={rephrasing.recruitmentProcess}
        suggestions={suggestions.recruitmentProcess}
        feedback={fieldFeedback.recruitmentProcess}
        placeholder="Interview stages, assessment, timeline..."
        rows={3}
      />

      {/* ── Section: Company Info ── */}
      <SectionHeading title="🏢 Company Information" />

      <FormTextArea
        label="Company Description"
        value={formData.companyDescription}
        onChange={(v) => handleChange("companyDescription", v)}
        onSpellCorrect={() => handleSpellCorrect("companyDescription")}
        onRephrase={() => handleRephraseField("companyDescription")}
        spellChecking={spellChecking.companyDescription}
        rephrasing={rephrasing.companyDescription}
        suggestions={suggestions.companyDescription}
        feedback={fieldFeedback.companyDescription}
        placeholder="About your company, culture, mission..."
        rows={4}
      />

      <FormTextArea
        label="Additional Information"
        value={formData.additionalInfo}
        onChange={(v) => handleChange("additionalInfo", v)}
        onSpellCorrect={() => handleSpellCorrect("additionalInfo")}
        onRephrase={() => handleRephraseField("additionalInfo")}
        spellChecking={spellChecking.additionalInfo}
        rephrasing={rephrasing.additionalInfo}
        suggestions={suggestions.additionalInfo}
        feedback={fieldFeedback.additionalInfo}
        placeholder="Any other relevant information..."
        rows={3}
      />

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 mt-8 flex-wrap">
        <button
          onClick={handleRephraseAll}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition"
        >
          {loading ? "Rephrasing..." : "✨ Rephrase All Fields"}
        </button>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition"
        >
          {loading ? "Verifying..." : "🔍 Verify JD"}
        </button>

        <button
          onClick={handlePostJob}
          disabled={loading || !verification?.isValid}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition"
          title={!verification?.isValid ? "Please verify JD first" : "Post the job"}
        >
          {loading ? "Posting..." : "📤 Post Job"}
        </button>
      </div>

      {/* ── Verification Results ── */}
      {verification && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${verification.isValid ? "bg-green-50 border-green-400" : "bg-yellow-50 border-yellow-400"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              {verification.isValid ? "✅ Verification Passed" : "⚠️ Needs Improvement"}
            </h3>
            <span className={`text-2xl font-bold ${verification.score >= 80 ? "text-green-600" : verification.score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {verification.score}/100
            </span>
          </div>

          {verification.issues?.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-red-700 mb-2">Issues Found:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {verification.issues.map((issue, i) => (
                  <li key={i} className="text-red-600 text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {verification.suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Suggestions:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {verification.suggestions.map((s, i) => (
                  <li key={i} className="text-blue-600 text-sm">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {verification.stats && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <h4 className="font-semibold text-gray-700 mb-1 text-sm">Statistics:</h4>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Characters: {verification.stats.characters}</span>
                <span>Words: {verification.stats.words}</span>
                <span>Paragraphs: {verification.stats.paragraphs}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">⚠️ Errors:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Section heading divider ────────────────────────────────────────────────
function SectionHeading({ title }) {
  return (
    <div className="mt-8 mb-4 pb-2 border-b-2 border-gray-200">
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
    </div>
  );
}

// ── Feedback banner shown below each field ─────────────────────────────────
function FieldFeedback({ feedback }) {
  if (!feedback) return null;
  const styles = {
    spell:    "bg-green-50 border-green-300 text-green-700",
    rephrase: "bg-purple-50 border-purple-300 text-purple-700",
    nochange: "bg-blue-50 border-blue-300 text-blue-700",
    error:    "bg-red-50 border-red-300 text-red-700",
  };
  return (
    <div className={`mt-1 px-3 py-1.5 rounded border text-sm ${styles[feedback.type] || styles.error}`}>
      {feedback.msg}
    </div>
  );
}

// ── AI Buttons row ─────────────────────────────────────────────────────────
function AIButtons({ onSpellCorrect, onRephrase, spellChecking, rephrasing, value }) {
  const hasText = value && value.trim().length > 0;
  const spellDisabled = spellChecking || rephrasing || !hasText;
  const rephraseDisabled = spellChecking || rephrasing || !hasText;

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      {/* Spell Correct */}
      <button
        type="button"
        onClick={onSpellCorrect}
        disabled={spellDisabled}
        title={hasText ? "Fix spelling & grammar only (keeps your wording)" : "Type something first"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: spellChecking
            ? "#bfdbfe"
            : hasText
            ? "linear-gradient(135deg,#3b82f6,#2563eb)"
            : "#d1d5db",
          color: hasText ? "#fff" : "#6b7280",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: spellDisabled ? "not-allowed" : "pointer",
          opacity: spellChecking ? 0.8 : 1,
          whiteSpace: "nowrap",
          transition: "all 0.15s",
          boxShadow: hasText && !spellDisabled ? "0 2px 6px rgba(59,130,246,0.35)" : "none",
        }}
      >
        {spellChecking ? "⏳ Checking..." : "🔤 Fix Spelling"}
      </button>

      {/* Rephrase to Formal */}
      <button
        type="button"
        onClick={onRephrase}
        disabled={rephraseDisabled}
        title={hasText ? "Rewrite in formal professional language" : "Type something first"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: rephrasing
            ? "#ddd6fe"
            : hasText
            ? "linear-gradient(135deg,#8b5cf6,#6d28d9)"
            : "#d1d5db",
          color: hasText ? "#fff" : "#6b7280",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: rephraseDisabled ? "not-allowed" : "pointer",
          opacity: rephrasing ? 0.8 : 1,
          whiteSpace: "nowrap",
          transition: "all 0.15s",
          boxShadow: hasText && !rephraseDisabled ? "0 2px 6px rgba(139,92,246,0.35)" : "none",
        }}
      >
        {rephrasing ? "⏳ Rephrasing..." : "✨ Rephrase to Formal"}
      </button>
    </div>
  );
}

// ── Single-line input field ────────────────────────────────────────────────
function FormField({
  label, value, onChange,
  onSpellCorrect, onRephrase,
  spellChecking, rephrasing,
  suggestions, feedback, placeholder,
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border ${suggestions?.length ? "border-yellow-400" : "border-gray-300"} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
        placeholder={placeholder}
      />
      <AIButtons
        onSpellCorrect={onSpellCorrect}
        onRephrase={onRephrase}
        spellChecking={spellChecking}
        rephrasing={rephrasing}
        value={value}
      />
      <FieldFeedback feedback={feedback} />
      {suggestions?.length > 0 && (
        <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          💡 {suggestions[0].message}
        </div>
      )}
    </div>
  );
}

// ── Multi-line textarea field ──────────────────────────────────────────────
function FormTextArea({
  label, value, onChange,
  onSpellCorrect, onRephrase,
  spellChecking, rephrasing,
  suggestions, feedback, placeholder, rows = 4,
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full border ${suggestions?.length ? "border-yellow-400" : "border-gray-300"} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-y`}
        placeholder={placeholder}
      />
      <AIButtons
        onSpellCorrect={onSpellCorrect}
        onRephrase={onRephrase}
        spellChecking={spellChecking}
        rephrasing={rephrasing}
        value={value}
      />
      <FieldFeedback feedback={feedback} />
      {suggestions?.length > 0 && (
        <div className="mt-1 text-sm space-y-1">
          {suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              💡 {s.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}