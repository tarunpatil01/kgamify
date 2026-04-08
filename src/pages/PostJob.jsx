import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
} from "@mui/material";
import { createJob } from "../api";
import usePlanMeta from '../hooks/usePlanMeta';
import AIEnhancedQuillEditor from '../components/AIEnhancedQuillEditor';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const jobTitleOptions = [
  'Software Developer', 'Senior Software Developer', 'Junior Software Developer',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Java Developer', 'Python Developer', 'JavaScript Developer',
  'React Developer', 'Angular Developer', 'Vue.js Developer', 'Node.js Developer',
  'DevOps Engineer', 'Software Engineer', 'Senior Software Engineer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'AI Engineer',
  'QA Engineer', 'Test Engineer', 'Automation Engineer',
  'Product Manager', 'Technical Product Manager', 'Project Manager', 'Scrum Master',
  'UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Business Analyst',
  'System Administrator', 'Database Administrator', 'Security Engineer',
  'Cybersecurity Analyst', 'Cloud Engineer', 'Cloud Architect', 'Solutions Architect',
  'Mobile Developer', 'iOS Developer', 'Android Developer', 'Game Developer',
  'Blockchain Developer',
];

const jobCategories = [
  "Engineering", "Software Development", "Data Science", "AI / Machine Learning",
  "Design", "Product Management", "Project Management", "Quality Assurance",
  "DevOps / SRE", "IT & Networking", "Cybersecurity", "Cloud Computing",
  "Marketing", "Sales", "Human Resources", "Finance", "Operations",
  "Customer Support", "Business Development", "Content & Copywriting",
  "Legal", "Education & Training", "Healthcare / MedTech", "Hardware / Embedded",
  "Analytics & BI", "Research & Development", "Other",
];

const languageOptions = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Gujarati',
  'Punjabi',
];

// Shared MUI sx helpers
const muiInputSx = (isDarkMode) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
    },
  },
});

const muiSelectSx = (isDarkMode) => ({
  color: isDarkMode ? 'white' : 'inherit',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
  },
  '& .MuiSvgIcon-root': { color: isDarkMode ? 'white' : 'inherit' },
});

const whitePaper = { PaperProps: { sx: { backgroundColor: 'white' } } };

export default function PostJob({ isDarkMode, email, userCompany }) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    employmentType: "",
    experienceLevel: "",
    remoteOrOnsite: "",
    location: "",
    salary: "",
    otherInfo: "",
    equity: "",
    sponsorship: "",
    recruitmentProcess: "",
    responsibilities: "",
    skills: "",
    benefits: "",
    eligibility: "",
    companyDescription: "",
    additionalInformation: "",
    status: "",
    numberOfPositions: "",
    category: "",
    tags: "",
    validUntil: "",
    languages: [],
    postedAt: new Date().toISOString(),
    companyEmail: email,
  });

  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying]       = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [jdFiles, setJdFiles]           = useState([]);
  const [jdError, setJdError]           = useState("");
  const [validityError, setValidityError] = useState("");

  useEffect(() => {
    if (email) setFormData(prev => ({ ...prev, companyEmail: email }));
  }, [email]);

  const companyEmail = (userCompany && userCompany.email) || email;
  const { planMeta } = usePlanMeta(companyEmail);

  const blockers = useMemo(() => {
    const issues = [];
    if (!userCompany) return issues;
    if (userCompany.status === 'hold')    issues.push('Your account is on hold. Check Messages for details.');
    if (userCompany.status === 'denied')  issues.push('Your account has been denied. Contact support.');
    if (userCompany.approved === false)   issues.push('Your account is not approved yet.');
    if (userCompany.emailVerified === false) issues.push('Verify your email before posting jobs.');
    if (userCompany.profileCompleted === false) issues.push('Complete your company profile before posting jobs.');
    if (userCompany.subscriptionEndsAt && new Date(userCompany.subscriptionEndsAt) < new Date())
      issues.push('Your subscription has expired. Upgrade to post jobs.');
    if (planMeta && typeof planMeta.remaining === 'number' && planMeta.remaining <= 0)
      issues.push('Job post limit reached for your plan. Upgrade or deactivate existing jobs.');
    return issues;
  }, [userCompany, planMeta]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // ── Handle languages selection ──
  const handleLanguagesChange = (event) => {
    const { value } = event.target;
    setFormData({ ...formData, languages: typeof value === 'string' ? value.split(',') : value });
  };

  // ── Strip HTML helper — removes Quill's empty paragraph <p><br></p> too ──
  const stripHtml = (html) =>
    (html || '')
      .replace(/<p><br><\/p>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // ── Prepare HTML for PDF — converts list bullets to visible characters ──
  const prepareHtmlForPdf = (html) => {
    if (!html) return '';
    return html
      .replace(/<ul[^>]*>/gi, '<div style="margin:4px 0">')
      .replace(/<\/ul>/gi, '</div>')
      .replace(/<ol[^>]*>/gi, '<div style="margin:4px 0">')
      .replace(/<\/ol>/gi, '</div>')
      .replace(/<li[^>]*>/gi, '<div style="padding:2px 0;padding-left:16px;position:relative"><span style="position:absolute;left:0;color:#374151">•</span>')
      .replace(/<\/li>/gi, '</div>');
  };

  // Handle AI-generated sections filling all fields at once
  const handleSectionsGenerated = (sections) => {
    setFormData(prev => ({
      ...prev,
      jobDescription:     sections.jobDescription     || prev.jobDescription,
      responsibilities:   sections.responsibilities   || prev.responsibilities,
      skills:             sections.skills             || prev.skills,
      eligibility:        sections.eligibility        || prev.eligibility,
      benefits:           sections.benefits           || prev.benefits,
      recruitmentProcess: sections.recruitmentProcess || prev.recruitmentProcess,
      otherInfo:          sections.otherInfo          || prev.otherInfo,
    }));
  };

  // ── Download PDF — uses hidden off-screen div, always in DOM ──
  const handleDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      const element = document.getElementById('jd-pdf-hidden');
      if (!element) {
        alert('PDF element not found. Please try again.');
        return;
      }

      // Temporarily make visible for capture
      element.style.display = 'block';
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = formData.jobTitle
        ? `${formData.jobTitle.replace(/[^a-z0-9]/gi, '_')}_JD.pdf`
        : 'Job_Description.pdf';

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(`PDF failed: ${err.message}`);
    } finally {
      setPdfDownloading(false);
      const el = document.getElementById('jd-pdf-hidden');
      if (el) el.style.display = 'none';
    }
  };

  // ── Verify JD — strips HTML first, validates on plain text ──
  const handleVerifyJD = async () => {
    const plainDescription = stripHtml(formData.jobDescription);

    if (!formData.jobTitle || !plainDescription) {
      alert("Job title and description are required for verification");
      return;
    }
    try {
      setVerifying(true);
      setVerification(null);
      const res = await fetch(`${API_BASE}/api/ai/verify-jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle:         formData.jobTitle,
          description:      plainDescription,
          requirements:     stripHtml(formData.skills),
          responsibilities: stripHtml(formData.responsibilities),
          location:         formData.location || '',
          salary:           formData.salary   || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Verification failed");
      setVerification(data);
    } catch (error) {
      alert(`Verification failed: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) { alert("You must be logged in to post a job"); navigate("/"); return; }

    try {
      if (jdFiles && jdFiles.length) {
        for (const f of jdFiles) {
          const name = f.name.toLowerCase();
          if (!name.endsWith('.pdf') && !name.endsWith('.doc') && !name.endsWith('.docx')) {
            setJdError('Only PDF, DOC, DOCX are allowed'); return;
          }
          if (f.size > 10 * 1024 * 1024) { setJdError('Each file must be less than 10MB'); return; }
        }
      }

      setValidityError("");
      if (planMeta && planMeta.paid) {
        if (!formData.validUntil) { setValidityError("Select a Job Validity date (required for paid plan)"); return; }
        const today  = new Date();
        const chosen = new Date(formData.validUntil + 'T00:00:00');
        if (chosen < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          setValidityError("Validity date cannot be in the past"); return;
        }
        if (planMeta.endsAt && chosen > planMeta.endsAt) {
          setValidityError("Validity cannot exceed subscription end date"); return;
        }
      } else if (planMeta && !planMeta.paid && formData.validUntil) {
        const chosen = new Date(formData.validUntil + 'T00:00:00');
        if (chosen < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) {
          setValidityError("Validity date cannot be in the past"); return;
        }
      }

      let payload;
      const headers = {};
      if (jdFiles && jdFiles.length) {
        payload = new FormData();
        Object.entries({ ...formData, companyEmail: email }).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            if (k === 'languages' && Array.isArray(v)) {
              payload.append(k, JSON.stringify(v));
            } else {
              payload.append(k, v);
            }
          }
        });
        jdFiles.forEach(file => payload.append('jdFiles', file));
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { ...formData, companyEmail: email };
        headers['Content-Type'] = 'application/json';
      }

      setSubmitError('');
      await createJob(payload, { headers });
      setOpenSnackbar(true);
      setTimeout(() => navigate("/job-posted"), 2000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setSubmitError(serverMsg || err?.message || 'Job posting failed');
    }
  };

  // Plain-text skills for the Generate button
  const plainSkills = stripHtml(formData.skills);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-8 px-2 sm:px-6 lg:px-8 ${
      isDarkMode
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
        : "bg-gradient-to-br from-orange-50 via-white to-orange-100 text-black"
    }`}>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className={`w-full max-w-3xl mx-auto mb-6 p-4 rounded border ${
          isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-900'
        }`}>
          <div className="font-semibold mb-1">Posting disabled</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            {blockers.map((msg, idx) => <li key={`${msg}-${idx}`}>{msg}</li>)}
          </ul>
          <div className="text-sm mt-2">
            See <a href="/messages" className="underline text-[#ff8200]">Messages</a> for admin notes.
          </div>
        </div>
      )}

      <div className={`w-full max-w-3xl mx-auto rounded-3xl shadow-2xl border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-orange-200"
      } p-6 sm:p-10`}>

        {/* Header */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg">
            Create a Job Post
          </h1>

          {submitError && (
            <div className={`w-full mt-2 p-3 rounded text-sm border ${
              isDarkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
            }`}>{submitError}</div>
          )}

          {planMeta && (
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="relative flex items-center justify-center" style={{ width: 54, height: 54 }}>
                {(() => {
                  const pct    = planMeta.limit ? ((planMeta.limit - planMeta.remaining) / planMeta.limit) * 100 : 0;
                  const stroke = 6;
                  const r      = 24 - stroke / 2;
                  const circ   = 2 * Math.PI * r;
                  const offset = circ - (pct / 100) * circ;
                  return (
                    <svg width={54} height={54} className="rotate-[-90deg]">
                      <circle cx={27} cy={27} r={r} stroke={isDarkMode ? '#374151' : '#f3f4f6'} strokeWidth={stroke} fill="none" />
                      <circle cx={27} cy={27} r={r}
                        stroke={planMeta.remaining > 0 ? '#ff8200' : '#dc2626'}
                        strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        fill="none" className="transition-all duration-500 ease-out"
                      />
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
                        style={{ fontSize: '10px', fontWeight: 600, fill: isDarkMode ? '#fff' : '#111' }}
                        transform="rotate(90 27 27)"
                      >{Math.round(pct)}%</text>
                    </svg>
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 w-fit rounded-full border ${
                  isDarkMode ? 'border-gray-600 text-gray-300' : 'border-orange-300 text-orange-800'
                } bg-white/10`}>{planMeta.plan} plan</span>
                <span className={`px-2 py-1 w-fit rounded-full ${
                  planMeta.remaining > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>{planMeta.remaining} / {planMeta.limit} posts remaining</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Verification Results */}
        {verification && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            verification.isValid ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {verification.isValid ? '✅ JD Looks Good!' : '⚠️ JD Needs Improvement'}
              </h3>
              <span className={`text-2xl font-bold ${
                verification.score >= 80 ? 'text-green-600' :
                verification.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>{verification.score}/100</span>
            </div>
            {verification.issues?.length > 0 && (
              <div className="mb-3">
                <h4 className="font-semibold text-red-700 mb-2">Issues:</h4>
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
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            {/* ── Job Details heading with Preview + Download PDF buttons ── */}
            <div className="flex items-center justify-between mb-6 border-b pb-2 border-dashed border-orange-300">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Job Details
              </h2>
              <div className="flex items-center gap-2">
                {/* Preview JD button */}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                >
                  <span>👁️</span><span>Preview JD</span>
                </button>

                {/* Download PDF button */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={pdfDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                >
                  {pdfDownloading
                    ? <><span className="animate-spin">⏳</span><span>Generating...</span></>
                    : <><span>📄</span><span>Download PDF</span></>
                  }
                </button>
              </div>
            </div>

            {/* ── Job Title — with Generate with AI button on the right ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">Job Title *</label>
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <span>🤖</span><span>Generate with AI</span>
                </button>
              </div>
              <Autocomplete
                freeSolo
                options={jobTitleOptions}
                value={formData.jobTitle}
                onChange={(_, newValue) => setFormData({ ...formData, jobTitle: newValue || '' })}
                onInputChange={(_, newInputValue) => setFormData({ ...formData, jobTitle: newInputValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select or type job title"
                    required
                    inputProps={{ ...params.inputProps, style: { color: isDarkMode ? 'white' : 'inherit' } }}
                    sx={muiInputSx(isDarkMode)}
                  />
                )}
                componentsProps={{ paper: { sx: { backgroundColor: 'white' } } }}
              />
            </div>

            {/* ── Job Description ── */}
            <div className="mb-6">
              <AIEnhancedQuillEditor
                value={formData.jobDescription}
                onChange={(content) => setFormData({ ...formData, jobDescription: content })}
                isDarkMode={isDarkMode}
                placeholder="Enter job description..."
                fieldName="jobDescription"
                showRephraseButton={true}
                showGenerateButton={false}
                label="Job Description *"
                jobTitle={formData.jobTitle}
                skills={plainSkills}
                onSectionsGenerated={handleSectionsGenerated}
                externalModalOpen={generateModalOpen}
                onExternalModalClose={() => setGenerateModalOpen(false)}
              />
            </div>

            {/* ── Employment Type + Experience ── */}
            <div className="mb-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Employment Type</label>
                <Select name="employmentType" value={formData.employmentType} onChange={handleChange}
                  fullWidth sx={muiSelectSx(isDarkMode)} MenuProps={whitePaper}>
                  <MenuItem value="">Select Employment Type</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                </Select>
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Experience Level</label>
                <Select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}
                  fullWidth sx={muiSelectSx(isDarkMode)} MenuProps={whitePaper}>
                  <MenuItem value="">Select Experience (years)</MenuItem>
                  <MenuItem value="0-2 years">0-2 years</MenuItem>
                  <MenuItem value="3-5 years">3-5 years</MenuItem>
                  <MenuItem value="6-8 years">6-8 years</MenuItem>
                  <MenuItem value="9-12 years">9-12 years</MenuItem>
                  <MenuItem value="12+ years">12+ years</MenuItem>
                </Select>
              </div>
            </div>

            {/* ── Remote + Location ── */}
            <div className="mb-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Remote or Onsite</label>
                <Select name="remoteOrOnsite" value={formData.remoteOrOnsite} onChange={handleChange}
                  fullWidth sx={muiSelectSx(isDarkMode)} MenuProps={whitePaper}>
                  <MenuItem value="">Select Option</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">Onsite</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block mb-2 font-medium">Location</label>
                <TextField name="location" value={formData.location} onChange={handleChange}
                  fullWidth inputProps={{ style: { color: isDarkMode ? 'white' : 'inherit' } }}
                  sx={muiInputSx(isDarkMode)} />
              </div>
            </div>

            {/* ── Salary ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Salary / Project Value</label>
              <TextField name="salary" value={formData.salary} onChange={handleChange}
                placeholder="e.g., ₹50,000 per month or ₹2,00,000 per project"
                fullWidth inputProps={{ style: { color: isDarkMode ? 'white' : 'inherit' } }}
                sx={muiInputSx(isDarkMode)} />
            </div>

            {/* ── Languages ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Languages</label>
              <Select
                name="languages"
                multiple
                value={formData.languages}
                onChange={handleLanguagesChange}
                fullWidth
                sx={muiSelectSx(isDarkMode)}
                MenuProps={whitePaper}
              >
                {languageOptions.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </Select>
              {formData.languages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#ff8200] text-white text-sm rounded-full"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            languages: formData.languages.filter((l) => l !== lang),
                          });
                        }}
                        className="ml-1 hover:opacity-75 transition"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Other Info (replaced from Relocation Benefits) ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Other Info</label>
              <AIEnhancedQuillEditor
                value={formData.otherInfo}
                onChange={(content) => setFormData({ ...formData, otherInfo: content })}
                isDarkMode={isDarkMode}
                placeholder="e.g., Full relocation package, moving allowance provided, flexible work hours, etc."
                fieldName="otherInfo"
                showRephraseButton={true}
              />
            </div>

            {/* ── Recruitment Process ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Recruitment Process</label>
              <AIEnhancedQuillEditor
                value={formData.recruitmentProcess}
                onChange={(content) => setFormData({ ...formData, recruitmentProcess: content })}
                isDarkMode={isDarkMode}
                placeholder="Describe the recruitment process (stages, rounds, timelines)..."
                fieldName="recruitmentProcess"
                showRephraseButton={true}
              />
            </div>

            {/* ── Responsibilities ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Responsibilities</label>
              <AIEnhancedQuillEditor
                value={formData.responsibilities}
                onChange={(content) => setFormData({ ...formData, responsibilities: content })}
                isDarkMode={isDarkMode}
                placeholder="List the key responsibilities..."
                fieldName="responsibilities"
                showRephraseButton={true}
              />
            </div>

            {/* ── Skills ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Skills</label>
              <AIEnhancedQuillEditor
                value={formData.skills}
                onChange={(content) => setFormData({ ...formData, skills: content })}
                isDarkMode={isDarkMode}
                placeholder="List required and preferred skills..."
                fieldName="skills"
                showRephraseButton={true}
              />
            </div>

            {/* ── Benefits ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Benefits</label>
              <AIEnhancedQuillEditor
                value={formData.benefits}
                onChange={(content) => setFormData({ ...formData, benefits: content })}
                isDarkMode={isDarkMode}
                placeholder="Describe compensation, perks, and benefits..."
                fieldName="benefits"
                showRephraseButton={true}
              />
            </div>

            {/* ── Eligibility ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Eligibility</label>
              <AIEnhancedQuillEditor
                value={formData.eligibility}
                onChange={(content) => setFormData({ ...formData, eligibility: content })}
                isDarkMode={isDarkMode}
                placeholder="Specify required qualifications or eligibility criteria..."
                fieldName="eligibility"
                showRephraseButton={true}
              />
            </div>

            {/* ── Company Description ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Company Description</label>
              <AIEnhancedQuillEditor
                value={formData.companyDescription}
                onChange={(content) => setFormData({ ...formData, companyDescription: content })}
                isDarkMode={isDarkMode}
                placeholder="Tell candidates about your company..."
                fieldName="companyDescription"
                showRephraseButton={true}
              />
            </div>

            {/* ── Additional Information ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Additional Information</label>
              <AIEnhancedQuillEditor
                value={formData.additionalInformation}
                onChange={(content) => setFormData({ ...formData, additionalInformation: content })}
                isDarkMode={isDarkMode}
                placeholder="Any other important details..."
                fieldName="additionalInformation"
                showRephraseButton={true}
              />
            </div>

            {/* ── JD File Upload ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Attach JD files (PDF/DOC/DOCX, optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={(e) => { setJdError(""); setJdFiles(Array.from(e.target.files || [])); }}
                className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff8200] file:text-white hover:file:bg-[#e57400] transition"
              />
              {jdFiles.length > 0 && (
                <ul className="mt-2 text-sm list-disc list-inside">
                  {jdFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
              )}
              {jdError && <p className="mt-1 text-sm text-red-500">{jdError}</p>}
            </div>

            {/* ── Status ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Status</label>
              <Select name="status" value={formData.status} onChange={handleChange}
                fullWidth sx={muiSelectSx(isDarkMode)} MenuProps={whitePaper}>
                <MenuItem value="">Select Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </div>

            {/* ── Number of Positions ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Number of Positions</label>
              <TextField
                name="numberOfPositions"
                value={formData.numberOfPositions}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d+$/.test(v)) setFormData({ ...formData, numberOfPositions: v });
                }}
                fullWidth inputProps={{ style: { color: isDarkMode ? 'white' : 'inherit' } }}
                sx={muiInputSx(isDarkMode)}
              />
            </div>

            {/* ── Category ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Category</label>
              <Autocomplete
                freeSolo
                options={jobCategories}
                value={formData.category}
                onChange={(_, newValue) => setFormData({ ...formData, category: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="category"
                    placeholder="Select or type a category"
                    onChange={(e) => { if (e.target.value) setFormData({ ...formData, category: e.target.value }); }}
                    fullWidth
                    inputProps={{ ...params.inputProps, style: { color: isDarkMode ? 'white' : 'inherit' } }}
                    sx={muiInputSx(isDarkMode)}
                  />
                )}
                componentsProps={{ paper: { sx: { backgroundColor: 'white' } } }}
              />
            </div>

            {/* ── Tags ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">Tags</label>
              <TextField name="tags" value={formData.tags} onChange={handleChange}
                fullWidth inputProps={{ style: { color: isDarkMode ? 'white' : 'inherit' } }}
                sx={muiInputSx(isDarkMode)} />
            </div>

            {/* ── Job Validity ── */}
            <div className="mb-6">
              <label className="block mb-2 font-medium">
                Job Validity (Expiry Date){planMeta?.paid ? ' *' : ''}
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={(e) => { setValidityError(''); setFormData({ ...formData, validUntil: e.target.value }); }}
                min={new Date().toISOString().slice(0, 10)}
                max={planMeta?.endsAt
                  ? new Date(planMeta.endsAt.getTime() - planMeta.endsAt.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
                  : undefined}
                className={`w-full rounded-md border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8200] ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'
                }`}
              />
              <p className="mt-2 text-xs text-gray-500">
                {planMeta?.paid && planMeta?.endsAt && `Must be on or before ${planMeta.endsAt.toISOString().slice(0, 10)}`}
                {!planMeta?.paid && 'Optional for Free plan; leave blank for indefinite.'}
              </p>
              {validityError && <p className="mt-1 text-sm text-red-600">{validityError}</p>}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleVerifyJD}
              disabled={verifying}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition"
            >
              {verifying ? "🔍 Verifying..." : "🔍 Verify JD"}
            </button>
            <button
              type="submit"
              className="flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347]"
            >
              Post Job
            </button>
          </div>
        </form>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ width: "100%" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity="success"
            sx={{
              width: "100%", maxWidth: "600px", fontSize: "1.1rem", borderRadius: "12px",
              background: isDarkMode
                ? "linear-gradient(90deg, #232526 0%, #ff8200 100%)"
                : "linear-gradient(90deg, #fffbe6 0%, #ffb347 100%)",
              color: isDarkMode ? "white" : "#232526",
              "& .MuiAlert-message": { fontSize: "1.1rem" },
            }}
          >
            Job posted successfully
          </Alert>
        </Snackbar>
      </div>

      {/* ── JD Preview Modal ── */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
        >
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div>
                <p className="text-white/80 text-sm font-medium">Job Preview</p>
                <h2 className="text-white text-2xl font-bold">
                  {formData.jobTitle || 'Untitled Position'}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.location && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">📍 {formData.location}</span>
                  )}
                  {formData.employmentType && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full capitalize">💼 {formData.employmentType}</span>
                  )}
                  {formData.remoteOrOnsite && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full capitalize">🏠 {formData.remoteOrOnsite}</span>
                  )}
                  {formData.salary && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">💰 {formData.salary}</span>
                  )}
                  {formData.experienceLevel && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">⭐ {formData.experienceLevel}</span>
                  )}
                  {formData.languages.length > 0 && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">🗣️ {formData.languages.join(', ')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-white hover:bg-white/20 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold transition-colors flex-shrink-0 ml-4"
              >×</button>
            </div>

            {/* Body — id added here for html2canvas capture */}
            <div id="jd-preview-content" className="px-8 py-6 space-y-6 text-gray-800 text-sm leading-relaxed bg-white">

              {/* Job title + badges repeated inside capture area for clean PDF */}
              <div className="pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{formData.jobTitle || 'Untitled Position'}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.location && <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full">📍 {formData.location}</span>}
                  {formData.employmentType && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full capitalize">💼 {formData.employmentType}</span>}
                  {formData.remoteOrOnsite && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full capitalize">🏠 {formData.remoteOrOnsite}</span>}
                  {formData.salary && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">💰 {formData.salary}</span>}
                  {formData.experienceLevel && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">⭐ {formData.experienceLevel}</span>}
                  {formData.languages.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">🗣️ {formData.languages.join(', ')}</span>}
                </div>
              </div>

              {/* Helper: render a section only if it has content */}
              {[
                { label: '📋 Job Description',      html: formData.jobDescription },
                { label: '🎯 Responsibilities',      html: formData.responsibilities },
                { label: '🛠️ Skills Required',      html: formData.skills },
                { label: '✅ Eligibility',           html: formData.eligibility },
                { label: '🎁 Benefits',              html: formData.benefits },
                { label: '🔄 Recruitment Process',  html: formData.recruitmentProcess },
                { label: 'ℹ️ Other Info',            html: formData.otherInfo },
                { label: '🏢 Company Description',  html: formData.companyDescription },
                { label: 'ℹ️ Additional Information', html: formData.additionalInformation },
              ].filter(sec => sec.html && sec.html.replace(/<[^>]*>/g, '').replace(/\s/g, '')).map((sec, i) => (
                <div key={i}>
                  <h3 className="font-bold text-base text-gray-900 mb-2 pb-1 border-b border-gray-100">{sec.label}</h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                      [&_li]:text-gray-700
                      [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1
                      [&_strong]:font-semibold [&_strong]:text-gray-900
                      [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: prepareHtmlForPdf(sec.html) }}
                  />
                </div>
              ))}

              {/* Meta fields */}
              {(formData.category || formData.tags || formData.numberOfPositions || formData.validUntil || formData.languages.length > 0) && (
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                  {formData.category && (
                    <div><span className="text-xs text-gray-500 block">Category</span><span className="font-medium">{formData.category}</span></div>
                  )}
                  {formData.numberOfPositions && (
                    <div><span className="text-xs text-gray-500 block">Openings</span><span className="font-medium">{formData.numberOfPositions}</span></div>
                  )}
                  {formData.languages.length > 0 && (
                    <div className="col-span-2"><span className="text-xs text-gray-500 block">Languages</span><span className="font-medium">{formData.languages.join(', ')}</span></div>
                  )}
                  {formData.tags && (
                    <div className="col-span-2"><span className="text-xs text-gray-500 block">Tags</span><span className="font-medium">{formData.tags}</span></div>
                  )}
                  {formData.validUntil && (
                    <div><span className="text-xs text-gray-500 block">Valid Until</span><span className="font-medium">{formData.validUntil}</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfDownloading}
                className="px-5 py-2 rounded-lg text-white font-semibold text-sm transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              >
                {pdfDownloading ? '⏳ Generating...' : '📄 Download PDF'}
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden PDF capture div — always in DOM, never visible to user ── */}
      <div
        id="jd-pdf-hidden"
        style={{
          display: 'none',
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          width: '794px',
          backgroundColor: '#ffffff',
          padding: '48px',
          zIndex: -1,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Title + badges */}
        <div style={{ borderBottom: '3px solid #f5576c', paddingBottom: '20px', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0' }}>
            {formData.jobTitle || 'Untitled Position'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {formData.location && (
              <span style={{ background: '#fce7f3', color: '#be185d', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500 }}>
                📍 {formData.location}
              </span>
            )}
            {formData.employmentType && (
              <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500, textTransform: 'capitalize' }}>
                💼 {formData.employmentType}
              </span>
            )}
            {formData.remoteOrOnsite && (
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500, textTransform: 'capitalize' }}>
                🏠 {formData.remoteOrOnsite}
              </span>
            )}
            {formData.salary && (
              <span style={{ background: '#fef9c3', color: '#a16207', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500 }}>
                💰 {formData.salary}
              </span>
            )}
            {formData.experienceLevel && (
              <span style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500 }}>
                ⭐ {formData.experienceLevel}
              </span>
            )}
            {formData.languages.length > 0 && (
              <span style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '12px', padding: '3px 12px', borderRadius: '999px', fontWeight: 500 }}>
                🗣️ {formData.languages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Content sections */}
        {[
          { label: 'Job Description',       html: formData.jobDescription },
          { label: 'Responsibilities',       html: formData.responsibilities },
          { label: 'Skills Required',        html: formData.skills },
          { label: 'Eligibility',            html: formData.eligibility },
          { label: 'Benefits',               html: formData.benefits },
          { label: 'Recruitment Process',    html: formData.recruitmentProcess },
          { label: 'Other Info',             html: formData.otherInfo },
          { label: 'Company Description',    html: formData.companyDescription },
          { label: 'Additional Information', html: formData.additionalInformation },
        ].filter(sec => sec.html && sec.html.replace(/<[^>]*>/g, '').replace(/\s/g, '')).map((sec, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '15px', fontWeight: 'bold', color: '#111827',
              borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '10px', margin: '0 0 10px 0',
            }}>
              {sec.label}
            </h3>
            <div
              style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: prepareHtmlForPdf(sec.html) }}
            />
          </div>
        ))}

        {/* Meta info */}
        {(formData.category || formData.numberOfPositions || formData.tags || formData.validUntil || formData.languages.length > 0) && (
          <div style={{
            background: '#f9fafb', borderRadius: '10px', padding: '18px',
            marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
          }}>
            {formData.category && (
              <div>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Category</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{formData.category}</span>
              </div>
            )}
            {formData.numberOfPositions && (
              <div>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Openings</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{formData.numberOfPositions}</span>
              </div>
            )}
            {formData.languages.length > 0 && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Languages</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{formData.languages.join(', ')}</span>
              </div>
            )}
            {formData.tags && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Tags</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{formData.tags}</span>
              </div>
            )}
            {formData.validUntil && (
              <div>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Valid Until</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{formData.validUntil}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

PostJob.propTypes = {
  isDarkMode: PropTypes.bool,
  email:      PropTypes.string,
  userCompany: PropTypes.object,
};