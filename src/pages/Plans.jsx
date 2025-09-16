import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { chooseSubscription } from '../api';

const PLAN_DESCRIPTIONS = {
  free: {
    title: 'Free',
    price: '₹0',
    features: ['Post 1 active job', 'Basic support', 'Community access']
  },
  pro: {
    title: 'Pro',
    price: '₹299/month',
    features: ['Post up to 10 active jobs', 'Priority email support', 'Basic analytics']
  },
  premium: {
    title: 'Premium',
    price: '₹699/month',
    features: ['Post up to 50 active jobs', 'Priority + chat support', 'Advanced analytics', 'Early feature access']
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

  const cards = [
    { key:'free', color:'border-gray-300', accent:'text-gray-600' },
    { key:'pro', color:'border-blue-300', accent:'text-blue-600' },
    { key:'premium', color:'border-amber-400', accent:'text-amber-600' },
  ];

  return (
    <div className={`min-h-screen py-10 px-4 flex justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent">Choose Your Plan</h1>
        <p className="text-sm opacity-80 mb-6">Pick a subscription to unlock more job posting capacity.</p>
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {cards.map(p => {
            const desc = PLAN_DESCRIPTIONS[p.key];
            const active = company?.subscriptionPlan === p.key && company?.subscriptionStatus === 'active';
            return (
              <div key={p.key} className={`relative rounded-xl border ${p.color} bg-white dark:bg-gray-800 p-6 flex flex-col shadow hover:shadow-lg transition`}>
                <h3 className={`text-xl font-bold mb-2 ${p.accent}`}>{desc.title}</h3>
                <div className="mb-4 flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-[#ff8200]">{desc.price}</span>
                </div>
                <ul className="text-sm mb-6 space-y-2 opacity-90">
                  {desc.features.map(f => <li key={f} className="flex items-start gap-2"><span className="text-[#ff8200] mt-0.5">•</span><span>{f}</span></li>)}
                </ul>
                {active ? (
                  <div className="mt-auto text-green-600 dark:text-green-400 font-semibold text-sm">Current Plan</div>
                ) : (
                  <button disabled={!!loadingPlan} onClick={()=>handleChoose(p.key)} className={`mt-auto w-full py-2.5 rounded-lg font-semibold text-white ${p.key==='free'? 'bg-gray-400 hover:bg-gray-500':'bg-gradient-to-r from-[#ff8200] to-[#ffb347] hover:from-[#e57400] hover:to-[#ffb347]'} disabled:opacity-50`}>
                    {loadingPlan===p.key? 'Processing...' : p.key==='free'? 'Activate Free' : 'Pay & Activate'}
                  </button>
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
