/**
 * Python ML Bridge Service
 * Connects Node.js backend to Python ML models
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to Python script (use lite version for Python 3.14 compatibility)
const PYTHON_SCRIPT = path.join(__dirname, 'ml_production.py');
const PYTHON_CMD = 'python'; // or 'python3' on some systems

/**
 * Call Python ML script
 * @param {string} action - 'rephrase', 'suggest', or 'check'
 * @param {string} text - Text to process
 * @returns {Promise<object>} Result from Python
 */
function callPythonML(action, text) {

  return new Promise((resolve, reject) => {
    
    // Spawn Python process
    const python = spawn(PYTHON_CMD, [PYTHON_SCRIPT, action, text]);
    
    let result = '';
    let error = '';
    
    // Collect stdout
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    // Collect stderr
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    // Handle completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python ML Error:', error);
        reject(new Error(`Python script failed with code ${code}: ${error}`));
        return;
      }
      
      try {
        const parsed = JSON.parse(result);
        
        // Check if Python returned an error
        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }
        
        resolve(parsed);
      } catch (e) {
        console.error('Failed to parse Python output:', result);
        reject(new Error('Invalid JSON from Python script'));
      }
    });
    
    // Handle spawn errors
    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

/**
 * Rephrase text to formal professional writing
 * Uses Python ML models (T5, SpaCy, LanguageTool)
 * @param {string} text - Input text
 * @returns {Promise<string>} Rephrased text
 */
async function rephraseWithML(text) {
  try {
    const result = await callPythonML('rephrase', text);
    return result.rephrased || text;
  } catch (error) {
    console.error('ML Rephrase error:', error.message);
    // Fallback to original text if ML fails
    return text;
  }
}

/**
 * Get real-time suggestions for text
 * @param {string} text - Input text
 * @returns {Promise<object>} Suggestions
 */
async function getSuggestionsML(text) {
  try {
    const result = await callPythonML('suggest', text);
    return {
      success: true,
      suggestions: result.suggestions || [],
      hasIssues: result.hasIssues || false,
      issueCount: result.issueCount || 0
    };
  } catch (error) {
    console.error('ML Suggestions error:', error.message);
    return {
      success: false,
      suggestions: [],
      hasIssues: false,
      issueCount: 0,
      error: error.message
    };
  }
}

/**
 * Check grammar and get detailed issues
 * @param {string} text - Input text
 * @returns {Promise<object>} Grammar issues
 */
async function checkGrammarML(text) {
  try {
    const result = await callPythonML('check', text);
    return result;
  } catch (error) {
    console.error('ML Grammar Check error:', error.message);
    return {
      success: false,
      issues: [],
      error: error.message
    };
  }
}

/**
 * Test if Python ML is available
 * @returns {Promise<boolean>}
 */
async function testPythonML() {
  try {
    await callPythonML('suggest', 'test');
    return true;
  } catch (error) {
    console.error('Python ML not available:', error.message);
    return false;
  }
}

module.exports = {
  rephraseWithML,
  getSuggestionsML,
  checkGrammarML,
  testPythonML
};
