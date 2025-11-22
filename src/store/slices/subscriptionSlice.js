import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plan: 'free',
  subscriptionStartedAt: null,
  subscriptionEndsAt: null,
  subscriptionJobLimit: 3,
  downgradedFromPlan: null,
  lastRefreshedAt: null
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription(state, action) {
      const payload = action.payload || {};
      state.plan = payload.plan || state.plan;
      state.subscriptionStartedAt = payload.subscriptionStartedAt || state.subscriptionStartedAt;
      state.subscriptionEndsAt = payload.subscriptionEndsAt || state.subscriptionEndsAt;
      state.subscriptionJobLimit = typeof payload.subscriptionJobLimit === 'number' ? payload.subscriptionJobLimit : state.subscriptionJobLimit;
      state.downgradedFromPlan = payload.downgradedFromPlan || state.downgradedFromPlan;
      state.lastRefreshedAt = new Date().toISOString();
    },
    clearSubscription(state) {
      state.plan = 'free';
      state.subscriptionStartedAt = null;
      state.subscriptionEndsAt = null;
      state.subscriptionJobLimit = 3;
      state.downgradedFromPlan = null;
      state.lastRefreshedAt = new Date().toISOString();
    }
  }
});

export const { setSubscription, clearSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
