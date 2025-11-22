// Central helper to normalize subscription data from a company object
// Returns an object compatible with subscription slice setSubscription payload
export function extractSubscriptionSnapshot(company) {
  if (!company || typeof company !== 'object') {
    return {
      plan: 'free',
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
      subscriptionJobLimit: 3,
      downgradedFromPlan: null
    };
  }
  return {
    plan: company.subscriptionPlan || 'free',
    subscriptionStartedAt: company.subscriptionStartedAt || company.startedAt || null,
    subscriptionEndsAt: company.subscriptionEndsAt || company.endsAt || company.endAt || null,
    subscriptionJobLimit: typeof company.subscriptionJobLimit === 'number' ? company.subscriptionJobLimit : (company.jobLimit || 3),
    downgradedFromPlan: company.downgradedFromPlan || null
  };
}

export default extractSubscriptionSnapshot;
