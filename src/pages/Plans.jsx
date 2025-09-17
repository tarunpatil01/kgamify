import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { chooseSubscription } from '../api';
import { FaRocket, FaStar, FaUserTie, FaDatabase } from "react-icons/fa";

// Updated plan descriptions and features
const PLAN_DESCRIPTIONS = {
  free: {
    title: 'Free Plan',
    price: '₹0',
    features: [
      'Post 1 active job',
      'Basic listing visibility (lower priority in search)',
      'Community access & basic support'
    ]
  },
  standard: {
    title: 'Standard Sponsored',
    price: '₹1,499/month',
    altPrice: '₹14,999/year (save ~2 months)',
    jobPrice: '₹200/job',
    features: [
      'Post up to 10 active jobs',
      'Boosted visibility in search results & alerts',
      'Priority placement compared to free listings',
      'Basic analytics on job performance'
    ]
  },
  premium: {
    title: 'Premium Sponsored',
    price: '₹3,999/month',
    altPrice: '₹39,999/year (save ~3 months)',
    jobPrice: '₹500/job',
    features: [
      'Post up to 50 active jobs',
      'All Standard Sponsored features',
      '“Urgently Hiring” tag & company branding',
      'Featured job slots & maximum reach',
      'Advanced analytics & insights'
    ]
  },
  resume: {
    title: 'Resume Sourcing (Add-On)',
    price: '₹8,000/month',
    altPrice: '₹72,000/year (save ~2 months)',
    features: [
      'Contact up to 30 candidates/month',
      'Access to candidate resume database',
      'Advanced search & filtering',
      'Direct candidate outreach (emails/messages)'
    ]
  }
};

export default function Plans({ isDarkMode = false }) {
  const [company, setCompany] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('companyData') || 'null');
      if (cached) setCompany(cached);
    } catch { /* ignore */ }
  }, []);

  async function handleChoose(plan){
    setError(''); setSuccess('');
    if (!company?.email){ setError('Please login to choose a plan.'); return; }
    try {
      setLoadingPlan(plan);
      const res = await chooseSubscription(company.email, plan);
      const updated = { ...company, ...res.company };
      localStorage.setItem('companyData', JSON.stringify(updated));
      setCompany(updated);
      setSuccess(`${PLAN_DESCRIPTIONS[plan].title} plan activated`);
    } catch(err){
      setError(err.message||'Failed to choose plan');
    } finally { setLoadingPlan(''); }
  }

  // Updated cards array for new plans
  const cards = [
    { key:'free', color:'border-gray-200', accent:'text-gray-600', icon: <FaUserTie className="text-2xl text-gray-400" /> },
    { key:'standard', color:'border-blue-200', accent:'text-blue-600', icon: <FaRocket className="text-2xl text-blue-400" /> },
    { key:'premium', color:'border-amber-300', accent:'text-amber-600', icon: <FaStar className="text-2xl text-amber-400" /> },
    { key:'resume', color:'border-green-200', accent:'text-green-600', icon: <FaDatabase className="text-2xl text-green-400" /> }
  ];

  return (
    <div className={`min-h-screen py-0 px-0 flex flex-col items-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header Section */}
      <div className={`w-full bg-gradient-to-r from-[#ff8200] to-[#ffb347] py-12 mb-10 flex flex-col items-center ${isDarkMode ? 'bg-gray-900' : ''}`}>
        <FaRocket className="text-5xl text-white mb-4" />
        <h1 className="text-4xl font-extrabold mb-2 text-white drop-shadow-lg">Choose Your Plan</h1>
        <p className="text-lg opacity-90 mb-2 text-white font-medium">Select a subscription to post jobs, boost visibility, and access premium hiring features.</p>
      </div>
      <div className="w-full max-w-7xl px-4">
        {error && <div className={`mb-4 p-3 rounded ${isDarkMode ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-50 text-red-600 border-red-200'} text-sm border`}>{error}</div>}
        {success && <div className={`mb-4 p-3 rounded ${isDarkMode ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-50 text-green-700 border-green-200'} text-sm border`}>{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {cards.map((p, idx) => {
            const desc = PLAN_DESCRIPTIONS[p.key];
            const active = company?.subscriptionPlan === p.key && company?.subscriptionStatus === 'active';
            // Add-on card style
            const isAddon = p.key === 'resume';
            // Add margin-bottom for all except last card
            const cardMargin = idx < cards.length - 1 ? 'mb-6' : '';
            return (
              <div
                key={p.key}
                className={`relative rounded-3xl border ${p.color} ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-8 flex flex-col shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1
                  ${isAddon ? 'border-2 border-green-400 ring-2 ring-green-100 dark:ring-green-900' : ''} ${cardMargin}
                `}
                style={isAddon ? { minHeight: 420 } : {}}
              >
                <div className="flex items-center gap-3 mb-2">
                  {p.icon}
                  <h3 className={`text-2xl font-bold ${p.accent} ${isDarkMode ? 'text-white' : ''}`}>{desc.title}</h3>
                </div>
                <div className="mb-4 flex flex-col gap-1">
                  <span className="text-4xl font-extrabold text-[#ff8200]">{desc.price}</span>
                  {desc.altPrice && <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{desc.altPrice}</span>}
                  {desc.jobPrice && <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{desc.jobPrice}</span>}
                </div>
                <ul className="text-base mb-8 space-y-3 opacity-95">
                  {desc.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[#ff8200] mt-0.5 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {active ? (
                  <div className="mt-auto text-green-600 dark:text-green-400 font-semibold text-base text-center">Current Plan</div>
                ) : (
                  <button
                    disabled={!!loadingPlan}
                    onClick={()=>handleChoose(p.key)}
                    className={`mt-auto w-full py-3 rounded-xl font-bold text-lg text-white shadow-lg ${
                      p.key==='free'
                        ? isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'
                        : p.key==='resume'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gradient-to-r from-[#ff8200] to-[#ffb347] hover:from-[#e57400] hover:to-[#ffb347]'
                    } disabled:opacity-50 transition-all duration-200`}
                  >
                    {loadingPlan===p.key
                      ? 'Processing...'
                      : p.key==='free'
                        ? 'Activate Free'
                        : p.key==='resume'
                          ? 'Subscribe Now'
                          : 'Pay & Activate'
                    }
                  </button>
                )}
                {isAddon && (
                  <div className={`absolute top-4 right-4 px-3 py-1 ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'} rounded-full text-xs font-bold shadow`}>Add-On</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Plans.propTypes = { isDarkMode: PropTypes.bool };
