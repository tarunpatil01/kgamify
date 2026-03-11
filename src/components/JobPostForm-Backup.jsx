import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function JobPostForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "",
    salary: ""
  });

  const [verification, setVerification] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rephrasing, setRephrasing] = useState({});
  const [success, setSuccess] = useState("");
  const [suggestions, setSuggestions] = useState({});

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

  // Get AI suggestions for a field
  const checkSuggestions = async (field, text) => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, field })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestions.length > 0) {
          setSuggestions(prev => ({
            ...prev,
            [field]: data.suggestions
          }));
        } else {
          setSuggestions(prev => {
            const newSuggestions = { ...prev };
            delete newSuggestions[field];
            return newSuggestions;
          });
        }
      }
    } catch (error) {
      console.error("Suggestion error:", error);
    }
  };

  // Update form field
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setVerification(null); // Clear verification when editing
  };

  // Rephrase a specific field
  const handleRephraseField = async (field) => {
    const text = formData[field];
    
    if (!text || !text.trim()) {
      return;
    }

    try {
      setRephrasing(prev => ({ ...prev, [field]: true }));

      const res = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Rephrase failed");
      }

      setFormData(prev => ({
        ...prev,
        [field]: data.rephrasedText || text
      }));

      // Clear suggestions for this field
      setSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[field];
        return newSuggestions;
      });

    } catch (error) {
      console.error(`Rephrase error for ${field}:`, error);
      alert(`Failed to rephrase ${field}: ${error.message}`);
    } finally {
      setRephrasing(prev => ({ ...prev, [field]: false }));
    }
  };

  // Rephrase all fields at once
  const handleRephraseAll = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/ai/rephrase-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fields: formData })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Batch rephrase failed");
      }

      setFormData(data.rephrased);
      setSuggestions({});
      alert("✅ All fields rephrased successfully!");

    } catch (error) {
      setErrors([error.message || "Failed to rephrase all fields"]);
    } finally {
      setLoading(false);
    }
  };

  // Verify JD before posting
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
          salary: formData.salary
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setVerification(data);

      if (!data.isValid) {
        setErrors(["Job description needs improvement. See issues below."]);
      }

    } catch (error) {
      setErrors([error.message || "Verification failed"]);
    } finally {
      setLoading(false);
    }
  };

  // Post the job
  const handlePostJob = async () => {
    // First verify
    if (!verification || !verification.isValid) {
      setErrors(["Please verify the job description first and fix all issues."]);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);
      setSuccess("");

      const token = localStorage.getItem('token'); // Adjust based on your auth

      const res = await fetch(`${API_BASE}/api/job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          responsibilities: formData.responsibilities,
          location: formData.location,
          salary: formData.salary
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Job posting failed");
      }

      setSuccess("✅ Job Posted Successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        requirements: "",
        responsibilities: "",
        location: "",
        salary: ""
      });
      setVerification(null);
      setSuggestions({});

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      setErrors([error.message || "Failed to post job"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create Job Post</h2>

      {/* Success Message at Top */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg font-semibold">
          {success}
        </div>
      )}

      {/* Job Title */}
      <FormField
        label="Job Title *"
        value={formData.title}
        onChange={(value) => handleChange("title", value)}
        onRephrase={() => handleRephraseField("title")}
        rephrasing={rephrasing.title}
        suggestions={suggestions.title}
        placeholder="e.g., Senior Software Engineer"
      />

      {/* Job Description */}
      <FormTextArea
        label="Job Description *"
        value={formData.description}
        onChange={(value) => handleChange("description", value)}
        onRephrase={() => handleRephraseField("description")}
        rephrasing={rephrasing.description}
        suggestions={suggestions.description}
        placeholder="Describe the role, what the candidate will do..."
        rows={6}
      />

      {/* Requirements */}
      <FormTextArea
        label="Requirements"
        value={formData.requirements}
        onChange={(value) => handleChange("requirements", value)}
        onRephrase={() => handleRephraseField("requirements")}
        rephrasing={rephrasing.requirements}
        suggestions={suggestions.requirements}
        placeholder="List the required skills, experience, qualifications..."
        rows={4}
      />

      {/* Responsibilities */}
      <FormTextArea
        label="Responsibilities"
        value={formData.responsibilities}
        onChange={(value) => handleChange("responsibilities", value)}
        onRephrase={() => handleRephraseField("responsibilities")}
        rephrasing={rephrasing.responsibilities}
        suggestions={suggestions.responsibilities}
        placeholder="Key responsibilities and duties..."
        rows={4}
      />

      {/* Location */}
      <FormField
        label="Location"
        value={formData.location}
        onChange={(value) => handleChange("location", value)}
        onRephrase={() => handleRephraseField("location")}
        rephrasing={rephrasing.location}
        suggestions={suggestions.location}
        placeholder="e.g., Remote, New York, Hybrid"
      />

      {/* Salary */}
      <FormField
        label="Salary"
        value={formData.salary}
        onChange={(value) => handleChange("salary", value)}
        onRephrase={() => handleRephraseField("salary")}
        rephrasing={rephrasing.salary}
        suggestions={suggestions.salary}
        placeholder="e.g., $80,000 - $120,000 or Competitive"
      />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <button
          onClick={handleRephraseAll}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition"
          title="Rephrase all fields to formal professional writing"
        >
          {loading ? "Rephrasing..." : "✨ Rephrase All Fields"}
        </button>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition"
          title="Verify job description quality before posting"
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

      {/* Verification Results */}
      {verification && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${verification.isValid ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              {verification.isValid ? '✅ Verification Passed' : '⚠️ Needs Improvement'}
            </h3>
            <span className={`text-2xl font-bold ${verification.score >= 80 ? 'text-green-600' : verification.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {verification.score}/100
            </span>
          </div>

          {verification.issues && verification.issues.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-red-700 mb-2">Issues Found:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {verification.issues.map((issue, i) => (
                  <li key={i} className="text-red-600 text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {verification.suggestions && verification.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Suggestions:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {verification.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-blue-600 text-sm">{suggestion}</li>
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

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">⚠️ Errors:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Reusable text input field with AI features
function FormField({ label, value, onChange, onRephrase, rephrasing, suggestions, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border ${suggestions ? 'border-yellow-400' : 'border-gray-300'} rounded-lg p-3 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onRephrase}
          disabled={rephrasing || !value}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition"
          title="Rephrase to formal writing"
        >
          {rephrasing ? "⏳" : "✨"}
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
          💡 {suggestions[0].message}
        </div>
      )}
    </div>
  );
}

// Reusable textarea with AI features
function FormTextArea({ label, value, onChange, onRephrase, rephrasing, suggestions, placeholder, rows = 4 }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={`w-full border ${suggestions ? 'border-yellow-400' : 'border-gray-300'} rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-y`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onRephrase}
          disabled={rephrasing || !value}
          className="absolute right-2 top-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition"
          title="Rephrase to formal writing"
        >
          {rephrasing ? "⏳" : "✨"}
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 text-sm space-y-1">
          {suggestions.slice(0, 3).map((sug, i) => (
            <div key={i} className="text-yellow-700 bg-yellow-50 p-2 rounded">
              💡 {sug.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}