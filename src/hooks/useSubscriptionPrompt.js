import { useEffect, useState } from 'react';

/**
 * useSubscriptionPrompt
 * Centralizes logic that decides whether to show subscription modal for a company.
 * Returns { shouldShow, setShouldShow, companyData, setCompanyData }
 *
 * Criteria:
 *  - companyData exists
 *  - companyData.emailVerified is true (or truthy)
 *  - company approved (status==='approved' or approved flag)
 *  - subscriptionPlan missing OR subscriptionStatus !== 'active'
 */
export function useSubscriptionPrompt(initialCompanyData) {
  const [companyData, setCompanyData] = useState(initialCompanyData || null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!companyData) return;
    // New logic: prompt when no plan or still on free plan.
    const needsPlan = !companyData.subscriptionPlan || companyData.subscriptionPlan === 'free';
    if (
      needsPlan &&
      (companyData.emailVerified || companyData.emailVerified === true) &&
      (companyData.status === 'approved' || companyData.approved)
    ) {
      setShouldShow(true);
    }
  }, [companyData]);

  return { shouldShow, setShouldShow, companyData, setCompanyData };
}

export default useSubscriptionPrompt;
