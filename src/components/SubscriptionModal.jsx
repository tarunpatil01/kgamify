import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { chooseSubscription } from '../api';

/*
  SubscriptionModal
  Purpose:
    Provide a lightweight, demo-friendly subscription picker without real payment integration.

  Key Behaviors:
    - Random promotional pricing for Silver & Gold generated every time the modal opens (client-side only).
    - Simulated payment: a 1.5s timeout stands in for a real processor before hitting chooseSubscription.
    - Free plan activates immediately with no delay.
    - On successful activation, updated company details merged & persisted to localStorage to prevent repeat prompting.

  Notes:
    This is intentionally minimal; replace handleChoose logic with real gateway (Stripe/Razorpay/etc) later.
*/

const PLAN_DESCRIPTIONS = {
  free: {
    title: 'Free',
    base: 0,
    features: ['Post 1 active job', 'Basic support', 'Community access']
  },
  silver: {
    title: 'Silver',
    base: 49,
    features: ['Up to 5 active jobs', 'Priority email support', 'Basic analytics']
  },
  gold: {
    title: 'Gold',
    base: 99,
    features: ['Up to 20 active jobs', 'Priority + chat support', 'Advanced analytics', 'Early feature access']
  }
};

export default function SubscriptionModal({ open, onClose, company, onChosen }) {
  const [promoPrices, setPromoPrices] = useState({ silver: 0, gold: 0 });
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{
    if (open){
      // Randomize promotional prices (e.g., Silver between 35-55, Gold between 70-110)
      const silver = Math.floor(35 + Math.random()*21); // 35-55
      const gold = Math.floor(70 + Math.random()*41);   // 70-110
      setPromoPrices({ silver, gold });
      setError('');
      setLoadingPlan('');
    }
  },[open]);

  if (!open) return null;

  async function handleChoose(plan){
    // Free plan chooses immediately, paid simulate payment
    setError('');
    if (plan === 'free'){
      try {
        setLoadingPlan(plan);
        const res = await chooseSubscription(company.email, plan);
        // Merge into existing company object
        const updated = { ...company, ...res.company };
        localStorage.setItem('companyData', JSON.stringify(updated));
        onChosen && onChosen(updated);
        onClose();
      } catch(err){
        setError(err.message||'Failed to choose plan');
      } finally { setLoadingPlan(''); }
      return;
    }
    // Simulated payment flow
    setLoadingPlan(plan);
    await new Promise(r=>setTimeout(r, 1500)); // fake payment processing
    try {
      const res = await chooseSubscription(company.email, plan);
      const updated = { ...company, ...res.company };
      localStorage.setItem('companyData', JSON.stringify(updated));
      onChosen && onChosen(updated);
      onClose();
    } catch(err){
      setError(err.message||'Payment failed');
    } finally { setLoadingPlan(''); }
  }

  const plans = [
    { key:'free', color:'border-gray-300', accent:'text-gray-600', price:'Free', promo:null },
    { key:'silver', color:'border-blue-300', accent:'text-blue-600', price:`$${promoPrices.silver}`, original:`$${PLAN_DESCRIPTIONS.silver.base}`, promo:true },
    { key:'gold', color:'border-amber-400', accent:'text-amber-600', price:`$${promoPrices.gold}`, original:`$${PLAN_DESCRIPTIONS.gold.base}`, promo:true }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-2xl shadow-2xl border border-orange-200 dark:border-gray-700 p-6 md:p-10 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✕</button>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent">Choose Your Plan</h2>
        <p className="text-sm text-gray-500 mb-6">Select a subscription to unlock job posting capacity. Promotional prices are randomized on each open (demo only).</p>
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p=>{
            const desc = PLAN_DESCRIPTIONS[p.key];
            const active = company?.subscriptionPlan === p.key && company?.subscriptionStatus === 'active';
            return (
              <div key={p.key} className={`relative rounded-xl border ${p.color} bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col shadow hover:shadow-lg transition`}> 
                {p.promo && <span className="absolute top-3 left-3 bg-[#ff8200] text-white text-xs font-semibold px-2 py-1 rounded">Promo</span>}
                <h3 className="text-xl font-bold mb-2 {p.accent}">{desc.title}</h3>
                <div className="mb-4 flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-[#ff8200]">{p.price}</span>
                  {p.original && <span className="line-through text-gray-400 text-sm">{p.original}</span>}
                  {p.key!=='free' && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Save {p.key==='silver'? (PLAN_DESCRIPTIONS.silver.base - promoPrices.silver) : (PLAN_DESCRIPTIONS.gold.base - promoPrices.gold)}$</span>}
                </div>
                <ul className="text-sm mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                  {desc.features.map(f=> <li key={f} className="flex items-start gap-2"><span className="text-[#ff8200] mt-0.5">•</span><span>{f}</span></li>)}
                </ul>
                {active && <div className="mt-auto text-green-600 font-semibold text-sm">Current Plan</div>}
                {!active && (
                  <button disabled={!!loadingPlan} onClick={()=>handleChoose(p.key)} className={`mt-auto w-full py-2.5 rounded-lg font-semibold text-white ${p.key==='free'? 'bg-gray-400 hover:bg-gray-500':'bg-gradient-to-r from-[#ff8200] to-[#ffb347] hover:from-[#e57400] hover:to-[#ffb347]'} disabled:opacity-50 flex items-center justify-center`}>
                    {loadingPlan===p.key? 'Processing...' : p.key==='free'? 'Activate Free' : `Pay & Activate`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 mt-6">Demo: Payment is simulated with a timeout and no real transaction occurs.</div>
      </div>
    </div>
  );
}

SubscriptionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  company: PropTypes.object,
  onChosen: PropTypes.func
};
