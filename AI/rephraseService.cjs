/**
 * Text Rephrasing Service
 * Converts casual text to formal professional writing
 * Fixes grammar and spelling
 */

/**
 * Rephrase text to formal professional writing
 * @param {string} text - Input text to rephrase
 * @returns {Promise<string>} Rephrased text
 */
async function rephraseJD(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let rephrased = text.trim();

  // 1. Fix common spelling mistakes
  const spellingCorrections = {
    // Common spelling mistakes
    'experiance': 'experience',
    'experiances': 'experiences',
    'managment': 'management',
    'responsibilty': 'responsibility',
    'responsibilitys': 'responsibilities',
    'oppertunity': 'opportunity',
    'oppertunities': 'opportunities',
    'recieve': 'receive',
    'occured': 'occurred',
    'developement': 'development',
    'enviroment': 'environment',
    'seperate': 'separate',
    'definately': 'definitely',
    'sucessful': 'successful',
    'sucessfully': 'successfully',
    'begining': 'beginning',
    'untill': 'until',
    'writting': 'writing',
    'occassion': 'occasion',
    'accomodate': 'accommodate',
    
    // Tech terms and programming languages - common typos
    'jhava': 'Java',
    'jaba': 'Java',
    'jva': 'Java',
    'jaava': 'Java',
    'javaa': 'Java',
    'pythn': 'Python',
    'pyton': 'Python',
    'phyton': 'Python',
    'pythom': 'Python',
    'pyhton': 'Python',
    'reactt': 'React',
    'raect': 'React',
    'recat': 'React',
    'reatc': 'React',
    'javascrpt': 'JavaScript',
    'javasript': 'JavaScript',
    'javascipt': 'JavaScript',
    'javasrcipt': 'JavaScript',
    'typescipt': 'TypeScript',
    'typescirpt': 'TypeScript',
    'typescript': 'TypeScript',
    'angualr': 'Angular',
    'anglar': 'Angular',
    'anguler': 'Angular',
    'nodjs': 'Node.js',
    'nodejs': 'Node.js',
    'nods': 'Node.js',
    'mongod': 'MongoDB',
    'mongodb': 'MongoDB',
    'mangodb': 'MongoDB',
    'postgre': 'PostgreSQL',
    'postgres': 'PostgreSQL',
    'postgressql': 'PostgreSQL',
    'mysqll': 'MySQL',
    'mysq': 'MySQL',
    'rediss': 'Redis',
    'reddis': 'Redis',
    'kubernetis': 'Kubernetes',
    'kubernets': 'Kubernetes',
    'kubernete': 'Kubernetes',
    'docekr': 'Docker',
    'dokcer': 'Docker',
    'doker': 'Docker',
    'awss': 'AWS',
    'aws': 'AWS',
    'azur': 'Azure',
    'azrue': 'Azure',
    'gcp': 'GCP',
    'googl': 'Google',
    'google': 'Google',
    'springbot': 'Spring Boot',
    'springboot': 'Spring Boot',
    'sprinboot': 'Spring Boot',
    'djago': 'Django',
    'jango': 'Django',
    'djangoo': 'Django',
    'flask': 'Flask',
    'flsk': 'Flask',
    'expresss': 'Express',
    'expres': 'Express',
    'laravel': 'Laravel',
    'laraval': 'Laravel',
    'vuejs': 'Vue.js',
    'vuee': 'Vue.js',
    'veu': 'Vue.js',
    'html': 'HTML',
    'htlm': 'HTML',
    'css': 'CSS',
    'csss': 'CSS',
    'sass': 'SASS',
    'sas': 'SASS',
    'scss': 'SCSS',
    'sccs': 'SCSS',
    'git': 'Git',
    'gitt': 'Git',
    'github': 'GitHub',
    'githib': 'GitHub',
    'gitlab': 'GitLab',
    'gitlb': 'GitLab',
    'jenkins': 'Jenkins',
    'jenkin': 'Jenkins',
    'jenkinss': 'Jenkins',
    'linux': 'Linux',
    'linuxx': 'Linux',
    'lunix': 'Linux',
    'api': 'API',
    'apis': 'APIs',
    'restful': 'RESTful',
    'rest': 'REST',
    'graphql': 'GraphQL',
    'graphqll': 'GraphQL',
    'grpc': 'gRPC',
    'microservice': 'microservice',
    'microservices': 'microservices',
    'agile': 'Agile',
    'agle': 'Agile',
    'scrum': 'Scrum',
    'scrm': 'Scrum',
    'devops': 'DevOps',
    'devop': 'DevOps',
    'cicd': 'CI/CD',
    'ci/cd': 'CI/CD'
  };

  // Apply spelling corrections (case-insensitive)
  Object.entries(spellingCorrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    rephrased = rephrased.replace(regex, (match) => {
      // Preserve original capitalization
      if (match[0] === match[0].toUpperCase()) {
        return correct.charAt(0).toUpperCase() + correct.slice(1);
      }
      return correct;
    });
  });

  // 2. Replace informal phrases with formal equivalents
  const informalToFormal = {
    // Contractions
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "doesn't": "does not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "didn't": "did not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "we're": "we are",
    "you're": "you are",
    "they're": "they are",
    "it's": "it is",
    "that's": "that is",
    "what's": "what is",
    "who's": "who is",
    
    // Informal phrases
    'a lot of': 'many',
    'lots of': 'numerous',
    'kind of': 'somewhat',
    'sort of': 'somewhat',
    'big': 'significant',
    'really good': 'excellent',
    'very good': 'excellent',
    'pretty good': 'satisfactory',
    'get': 'obtain',
    'got': 'obtained',
    'make sure': 'ensure',
    'find out': 'determine',
    'figure out': 'determine',
    'deal with': 'address',
    'look into': 'investigate',
    'come up with': 'develop',
    'work on': 'address',
    'help out': 'assist',
    'check out': 'examine',
    'right now': 'currently',
    'ASAP': 'as soon as possible',
    'FYI': 'for your information',
    'BTW': 'by the way',
    'basically': '',
    'actually': '',
    'literally': '',
    
    // Professional replacements
    'guy': 'person',
    'guys': 'people',
    'gal': 'person',
    'kids': 'children',
    'job seeker': 'candidate',
    'apply now': 'submit your application',
    'must have': 'required',
    'nice to have': 'preferred',
    'rockstar': 'exceptional professional',
    'ninja': 'expert',
    'guru': 'specialist',
    'wizard': 'expert'
  };

  // Apply formal replacements (case-insensitive, whole words)
  Object.entries(informalToFormal).forEach(([informal, formal]) => {
    const regex = new RegExp(`\\b${informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    rephrased = rephrased.replace(regex, formal);
  });

  // 3. Fix grammar issues
  
  // Fix double spaces
  rephrased = rephrased.replace(/\s{2,}/g, ' ');
  
  // Fix space before punctuation
  rephrased = rephrased.replace(/\s+([.,!?;:])/g, '$1');
  
  // Ensure space after punctuation
  rephrased = rephrased.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');
  
  // Fix multiple punctuation
  rephrased = rephrased.replace(/[!]{2,}/g, '!');
  rephrased = rephrased.replace(/[?]{2,}/g, '?');
  
  // Remove excessive exclamation marks (keep max 1 per sentence)
  rephrased = rephrased.replace(/!+/g, '.');
  
  // 4. Capitalize sentences properly
  rephrased = rephrased.replace(/(^\w|[.!?]\s+\w)/g, match => match.toUpperCase());
  
  // 5. Fix common grammar patterns
  
  // "a" vs "an"
  rephrased = rephrased.replace(/\ba\s+([aeiou])/gi, 'an $1');
  rephrased = rephrased.replace(/\ban\s+([^aeiou])/gi, 'a $1');
  
  // Fix "i" to "I"
  rephrased = rephrased.replace(/\bi\s/g, 'I ');
  
  // 6. Improve sentence structure
  
  // Add period at the end if missing
  if (!/[.!?]$/.test(rephrased.trim())) {
    rephrased = rephrased.trim() + '.';
  }

  // 7. Professional tone adjustments
  
  // Replace "you" with more formal alternatives in job descriptions
  rephrased = rephrased.replace(/\byou will\b/gi, 'the successful candidate will');
  rephrased = rephrased.replace(/\byou must\b/gi, 'candidates must');
  rephrased = rephrased.replace(/\byou should\b/gi, 'applicants should');
  
  // 8. Clean up extra whitespace
  rephrased = rephrased.replace(/^\s+|\s+$/gm, ''); // Trim lines
  rephrased = rephrased.replace(/\n{3,}/g, '\n\n');  // Max 2 line breaks
  
  return rephrased;
}

/**
 * Check text for grammar and spelling issues without rephrasing
 * @param {string} text - Input text
 * @returns {Array} Array of issues found
 */
function checkIssues(text) {
  const issues = [];
  
  if (!text || typeof text !== 'string') {
    return issues;
  }

  // Check for common spelling mistakes
  const spellingErrors = [
    'experiance', 'managment', 'responsibilty', 'oppertunity',
    'recieve', 'occured', 'developement', 'enviroment', 'seperate'
  ];
  
  spellingErrors.forEach(error => {
    const regex = new RegExp(`\\b${error}\\b`, 'gi');
    if (regex.test(text)) {
      issues.push({
        type: 'spelling',
        word: error,
        message: `Possible spelling error: "${error}"`
      });
    }
  });

  // Check for grammar issues
  if (text.includes('  ')) {
    issues.push({
      type: 'grammar',
      message: 'Multiple spaces detected'
    });
  }

  // Check for informal language
  const informalWords = ["can't", "won't", "don't", 'basically', 'literally', 'ASAP'];
  informalWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(text)) {
      issues.push({
        type: 'tone',
        word: word,
        message: `Informal language detected: "${word}"`
      });
    }
  });

  return issues;
}

module.exports = { 
  rephraseJD,
  checkIssues
};
