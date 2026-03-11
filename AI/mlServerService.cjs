/**
 * ML Service - Fast Version
 * Connects to persistent Python ML server instead of spawning processes
 * Models stay loaded = instant responses!
 */

const axios = require('axios');

// ML Server URL (runs on port 5001)
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

let serverAvailable = false;

/**
 * Test if ML server is running
 */
async function testMLServer() {
  try {
    const response = await axios.get(`${ML_SERVER_URL}/health`, { timeout: 2000 });
    serverAvailable = response.data.models_loaded === true;
    
    if (serverAvailable) {
      console.log(`✅ ML Server connected at ${ML_SERVER_URL}`);
    } else {
      console.log(`⚠️  ML Server found but models not loaded`);
    }
    
    return serverAvailable;
  } catch (error) {
    serverAvailable = false;
    console.log(`⚠️  ML Server not available at ${ML_SERVER_URL}`);
    console.log(`   Start it with: python AI/ml_server.py`);
    return false;
  }
}

/**
 * Rephrase text using ML
 * @param {string} text - Input text
 * @returns {Promise<string>} Rephrased text
 */
async function rephraseWithML(text) {
  try {
    const response = await axios.post(
      `${ML_SERVER_URL}/rephrase`,
      { text },
      { timeout: 10000 } // 10 second timeout
    );
    
    return response.data.rephrased || text;
  } catch (error) {
    console.error('ML rephrase error:', error.message);
    throw error;
  }
}

/**
 * Get suggestions for text
 * @param {string} text - Input text
 * @returns {Promise<object>} Suggestions
 */
async function getSuggestionsML(text) {
  try {
    const response = await axios.post(
      `${ML_SERVER_URL}/suggest`,
      { text },
      { timeout: 5000 }
    );
    
    return response.data;
  } catch (error) {
    console.error('ML suggestions error:', error.message);
    return {
      success: false,
      suggestions: [],
      hasIssues: false,
      issueCount: 0
    };
  }
}

/**
 * Check grammar
 * @param {string} text - Input text
 * @returns {Promise<object>} Grammar check results
 */
async function checkGrammarML(text) {
  try {
    const response = await axios.post(
      `${ML_SERVER_URL}/rephrase`,
      { text },
      { timeout: 10000 }
    );
    
    return {
      success: true,
      changes: response.data.changes || [],
      confidence: response.data.confidence || 0
    };
  } catch (error) {
    console.error('ML grammar check error:', error.message);
    return {
      success: false,
      changes: [],
      confidence: 0
    };
  }
}

module.exports = {
  rephraseWithML,
  getSuggestionsML,
  checkGrammarML,
  testMLServer,
  isAvailable: () => serverAvailable
};
