/**
 * Skill Matching Service
 * Advanced skill matching and scoring algorithms for job applications
 */
class SkillMatchingService {
  constructor() {
    this.skillDatabase = new Map();
    this.skillSynonyms = new Map();
    this.skillCategories = new Map();
    this.loadSkillDatabase();
  }

  /**
   * Load skill database with synonyms and categories
   */
  loadSkillDatabase() {
    // Programming Languages
    this.addSkillGroup('Programming Languages', [
      { name: 'JavaScript', synonyms: ['JS', 'Javascript', 'ECMAScript'], weight: 1.0 },
      { name: 'Python', synonyms: ['Python3', 'Py'], weight: 1.0 },
      { name: 'Java', synonyms: ['Java SE', 'Java EE'], weight: 1.0 },
      { name: 'TypeScript', synonyms: ['TS'], weight: 1.0 },
      { name: 'C++', synonyms: ['CPP', 'C Plus Plus'], weight: 1.0 },
      { name: 'C#', synonyms: ['CSharp', 'C Sharp'], weight: 1.0 },
      { name: 'Go', synonyms: ['Golang'], weight: 1.0 },
      { name: 'Rust', synonyms: [], weight: 1.0 },
      { name: 'PHP', synonyms: [], weight: 1.0 },
      { name: 'Ruby', synonyms: [], weight: 1.0 },
      { name: 'Swift', synonyms: [], weight: 1.0 },
      { name: 'Kotlin', synonyms: [], weight: 1.0 }
    ]);

    // Frontend Technologies
    this.addSkillGroup('Frontend', [
      { name: 'React', synonyms: ['ReactJS', 'React.js'], weight: 1.0 },
      { name: 'Vue.js', synonyms: ['Vue', 'VueJS'], weight: 1.0 },
      { name: 'Angular', synonyms: ['AngularJS'], weight: 1.0 },
      { name: 'HTML5', synonyms: ['HTML'], weight: 0.8 },
      { name: 'CSS3', synonyms: ['CSS'], weight: 0.8 },
      { name: 'SASS', synonyms: ['SCSS'], weight: 0.9 },
      { name: 'Tailwind CSS', synonyms: ['TailwindCSS'], weight: 0.9 },
      { name: 'Bootstrap', synonyms: [], weight: 0.8 },
      { name: 'Webpack', synonyms: [], weight: 0.9 },
      { name: 'Vite', synonyms: [], weight: 0.9 }
    ]);

    // Backend Technologies
    this.addSkillGroup('Backend', [
      { name: 'Node.js', synonyms: ['NodeJS', 'Node'], weight: 1.0 },
      { name: 'Express.js', synonyms: ['Express', 'ExpressJS'], weight: 0.9 },
      { name: 'Django', synonyms: [], weight: 1.0 },
      { name: 'Flask', synonyms: [], weight: 0.9 },
      { name: 'Spring Boot', synonyms: ['Spring'], weight: 1.0 },
      { name: 'Laravel', synonyms: [], weight: 1.0 },
      { name: 'Ruby on Rails', synonyms: ['Rails', 'RoR'], weight: 1.0 },
      { name: 'ASP.NET', synonyms: ['ASP.NET Core'], weight: 1.0 }
    ]);

    // Databases
    this.addSkillGroup('Databases', [
      { name: 'PostgreSQL', synonyms: ['Postgres'], weight: 1.0 },
      { name: 'MySQL', synonyms: [], weight: 1.0 },
      { name: 'MongoDB', synonyms: ['Mongo'], weight: 1.0 },
      { name: 'Redis', synonyms: [], weight: 0.9 },
      { name: 'SQLite', synonyms: [], weight: 0.8 },
      { name: 'Oracle', synonyms: ['Oracle DB'], weight: 1.0 },
      { name: 'SQL Server', synonyms: ['Microsoft SQL Server', 'MSSQL'], weight: 1.0 },
      { name: 'Elasticsearch', synonyms: ['ElasticSearch'], weight: 0.9 }
    ]);

    // Cloud & DevOps
    this.addSkillGroup('Cloud & DevOps', [
      { name: 'AWS', synonyms: ['Amazon Web Services'], weight: 1.0 },
      { name: 'Azure', synonyms: ['Microsoft Azure'], weight: 1.0 },
      { name: 'Google Cloud', synonyms: ['GCP', 'Google Cloud Platform'], weight: 1.0 },
      { name: 'Docker', synonyms: [], weight: 1.0 },
      { name: 'Kubernetes', synonyms: ['K8s'], weight: 1.0 },
      { name: 'Jenkins', synonyms: [], weight: 0.9 },
      { name: 'GitLab CI', synonyms: ['GitLab CI/CD'], weight: 0.9 },
      { name: 'Terraform', synonyms: [], weight: 0.9 },
      { name: 'Ansible', synonyms: [], weight: 0.9 }
    ]);

    // Data Science & ML
    this.addSkillGroup('Data Science', [
      { name: 'Machine Learning', synonyms: ['ML'], weight: 1.0 },
      { name: 'Deep Learning', synonyms: ['DL'], weight: 1.0 },
      { name: 'TensorFlow', synonyms: [], weight: 1.0 },
      { name: 'PyTorch', synonyms: [], weight: 1.0 },
      { name: 'Pandas', synonyms: [], weight: 0.9 },
      { name: 'NumPy', synonyms: [], weight: 0.9 },
      { name: 'Scikit-learn', synonyms: ['sklearn'], weight: 0.9 },
      { name: 'Data Analysis', synonyms: [], weight: 0.9 },
      { name: 'Statistics', synonyms: [], weight: 0.9 }
    ]);

    // Soft Skills
    this.addSkillGroup('Soft Skills', [
      { name: 'Leadership', synonyms: ['Team Leadership'], weight: 0.8 },
      { name: 'Communication', synonyms: [], weight: 0.8 },
      { name: 'Problem Solving', synonyms: [], weight: 0.8 },
      { name: 'Project Management', synonyms: [], weight: 0.9 },
      { name: 'Agile', synonyms: ['Agile Methodology'], weight: 0.9 },
      { name: 'Scrum', synonyms: [], weight: 0.9 },
      { name: 'Teamwork', synonyms: ['Team Collaboration'], weight: 0.8 }
    ]);
  }

  /**
   * Add skill group to database
   * @param {string} category - Skill category
   * @param {Array} skills - Array of skill objects
   */
  addSkillGroup(category, skills) {
    skills.forEach(skill => {
      const normalizedName = this.normalizeSkill(skill.name);
      
      this.skillDatabase.set(normalizedName, {
        name: skill.name,
        category,
        weight: skill.weight,
        synonyms: skill.synonyms
      });

      this.skillCategories.set(normalizedName, category);

      // Add synonyms
      skill.synonyms.forEach(synonym => {
        const normalizedSynonym = this.normalizeSkill(synonym);
        this.skillSynonyms.set(normalizedSynonym, normalizedName);
      });
    });
  }

  /**
   * Normalize skill name for matching
   * @param {string} skill - Skill name
   * @returns {string} Normalized skill name
   */
  normalizeSkill(skill) {
    return skill.toLowerCase()
      .replace(/[^a-z0-9+#]/g, '')
      .trim();
  }

  /**
   * Calculate skill match between candidate and job requirements
   * @param {Array} candidateSkills - Candidate's skills
   * @param {Array} requiredSkills - Job's required skills
   * @param {Object} options - Matching options
   * @returns {Object} Match result with score and details
   */
  async calculateMatch(candidateSkills, requiredSkills, options = {}) {
    const {
      strictMode = false,
      categoryWeights = {},
      minimumScore = 0.0,
      includeRecommendations = true
    } = options;

    // Normalize and categorize skills
    const candidateNormalized = this.normalizeSkillsList(candidateSkills);
    const requiredNormalized = this.normalizeSkillsList(requiredSkills);

    // Calculate matches
    const matches = this.findSkillMatches(candidateNormalized, requiredNormalized, strictMode);
    
    // Calculate weighted score
    const score = this.calculateWeightedScore(matches, categoryWeights);
    
    // Generate detailed analysis
    const analysis = this.generateMatchAnalysis(matches, candidateNormalized, requiredNormalized);
    
    // Generate recommendations if requested
    const recommendations = includeRecommendations 
      ? this.generateRecommendations(matches, requiredNormalized)
      : [];

    return {
      score: Math.round(score * 100) / 100,
      percentage: Math.round(score * 10000) / 100,
      matchQuality: this.getMatchQuality(score),
      matches,
      analysis,
      recommendations,
      candidateSkills: candidateNormalized,
      requiredSkills: requiredNormalized,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize list of skills
   * @param {Array} skills - Raw skills list
   * @returns {Array} Normalized skills with metadata
   */
  normalizeSkillsList(skills) {
    return skills.map(skill => {
      const normalized = this.normalizeSkill(skill);
      const canonical = this.skillSynonyms.get(normalized) || normalized;
      const skillData = this.skillDatabase.get(canonical);

      return {
        original: skill,
        normalized,
        canonical,
        category: skillData?.category || 'Other',
        weight: skillData?.weight || 0.5,
        recognized: !!skillData
      };
    }).filter(skill => skill.normalized.length > 0);
  }

  /**
   * Find matches between candidate and required skills
   * @param {Array} candidateSkills - Normalized candidate skills
   * @param {Array} requiredSkills - Normalized required skills
   * @param {boolean} strictMode - Whether to use strict matching
   * @returns {Array} Match results
   */
  findSkillMatches(candidateSkills, requiredSkills, strictMode = false) {
    const matches = [];
    const candidateMap = new Map();
    
    // Create lookup map for candidate skills
    candidateSkills.forEach(skill => {
      candidateMap.set(skill.canonical, skill);
    });

    requiredSkills.forEach(required => {
      const match = {
        required: required.original,
        requiredNormalized: required.canonical,
        category: required.category,
        weight: required.weight,
        found: false,
        matchType: 'none',
        matchScore: 0,
        candidateSkill: null
      };

      // Exact match
      if (candidateMap.has(required.canonical)) {
        match.found = true;
        match.matchType = 'exact';
        match.matchScore = 1.0;
        match.candidateSkill = candidateMap.get(required.canonical).original;
      }
      // Fuzzy match (if not strict mode)
      else if (!strictMode) {
        const fuzzyMatch = this.findFuzzyMatch(required, candidateSkills);
        if (fuzzyMatch) {
          match.found = true;
          match.matchType = 'fuzzy';
          match.matchScore = fuzzyMatch.score;
          match.candidateSkill = fuzzyMatch.skill.original;
        }
      }

      matches.push(match);
    });

    return matches;
  }

  /**
   * Find fuzzy match for a skill
   * @param {Object} targetSkill - Target skill to match
   * @param {Array} candidateSkills - Candidate skills to search
   * @returns {Object|null} Fuzzy match result
   */
  findFuzzyMatch(targetSkill, candidateSkills) {
    let bestMatch = null;
    let bestScore = 0.6; // Minimum fuzzy match threshold

    candidateSkills.forEach(candidateSkill => {
      // Category match bonus
      if (candidateSkill.category === targetSkill.category) {
        const similarity = this.calculateStringSimilarity(
          targetSkill.canonical,
          candidateSkill.canonical
        );

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = {
            skill: candidateSkill,
            score: similarity
          };
        }
      }
    });

    return bestMatch;
  }

  /**
   * Calculate string similarity using Jaro-Winkler algorithm
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / str1.length + matches / str2.length + 
                  (matches - transpositions / 2) / matches) / 3;

    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + (0.1 * prefix * (1 - jaro));
  }

  /**
   * Calculate weighted score based on matches
   * @param {Array} matches - Skill matches
   * @param {Object} categoryWeights - Category-specific weights
   * @returns {number} Weighted score (0-1)
   */
  calculateWeightedScore(matches, categoryWeights = {}) {
    if (matches.length === 0) return 0;

    const defaultWeights = {
      'Programming Languages': 1.2,
      'Frontend': 1.1,
      'Backend': 1.1,
      'Databases': 1.0,
      'Cloud & DevOps': 1.0,
      'Data Science': 1.1,
      'Soft Skills': 0.8,
      'Other': 0.7
    };

    const weights = { ...defaultWeights, ...categoryWeights };

    let totalWeight = 0;
    let achievedWeight = 0;

    matches.forEach(match => {
      const categoryWeight = weights[match.category] || 0.7;
      const skillWeight = match.weight;
      const finalWeight = categoryWeight * skillWeight;

      totalWeight += finalWeight;
      if (match.found) {
        achievedWeight += finalWeight * match.matchScore;
      }
    });

    return totalWeight > 0 ? achievedWeight / totalWeight : 0;
  }

  /**
   * Generate detailed match analysis
   * @param {Array} matches - Skill matches
   * @param {Array} candidateSkills - Candidate skills
   * @param {Array} requiredSkills - Required skills
   * @returns {Object} Detailed analysis
   */
  generateMatchAnalysis(matches, candidateSkills, requiredSkills) {
    const analysis = {
      totalRequired: requiredSkills.length,
      totalMatched: matches.filter(m => m.found).length,
      matchRate: 0,
      categoryBreakdown: {},
      strengthAreas: [],
      gapAreas: [],
      additionalSkills: []
    };

    analysis.matchRate = analysis.totalRequired > 0 
      ? analysis.totalMatched / analysis.totalRequired 
      : 0;

    // Category breakdown
    const categoryStats = {};
    matches.forEach(match => {
      if (!categoryStats[match.category]) {
        categoryStats[match.category] = {
          required: 0,
          matched: 0,
          skills: []
        };
      }
      categoryStats[match.category].required++;
      categoryStats[match.category].skills.push(match);
      if (match.found) {
        categoryStats[match.category].matched++;
      }
    });

    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      analysis.categoryBreakdown[category] = {
        required: stats.required,
        matched: stats.matched,
        rate: stats.matched / stats.required,
        skills: stats.skills
      };

      // Identify strength and gap areas
      if (stats.rate >= 0.8) {
        analysis.strengthAreas.push(category);
      } else if (stats.rate < 0.5) {
        analysis.gapAreas.push(category);
      }
    });

    // Find additional skills not required
    const requiredCanonical = new Set(requiredSkills.map(s => s.canonical));
    analysis.additionalSkills = candidateSkills
      .filter(skill => !requiredCanonical.has(skill.canonical))
      .map(skill => ({
        name: skill.original,
        category: skill.category,
        recognized: skill.recognized
      }));

    return analysis;
  }

  /**
   * Generate skill improvement recommendations
   * @param {Array} matches - Skill matches
   * @param {Array} requiredSkills - Required skills
   * @returns {Array} Recommendations
   */
  generateRecommendations(matches, requiredSkills) {
    const recommendations = [];
    const missingSkills = matches.filter(m => !m.found);

    // Priority recommendations based on skill weight and category
    const priorityMap = {
      'Programming Languages': 5,
      'Frontend': 4,
      'Backend': 4,
      'Databases': 3,
      'Cloud & DevOps': 3,
      'Data Science': 4,
      'Soft Skills': 2,
      'Other': 1
    };

    missingSkills
      .sort((a, b) => {
        const priorityA = priorityMap[a.category] || 1;
        const priorityB = priorityMap[b.category] || 1;
        const weightA = a.weight;
        const weightB = b.weight;
        return (priorityB * weightB) - (priorityA * weightA);
      })
      .slice(0, 10) // Top 10 recommendations
      .forEach((skill, index) => {
        recommendations.push({
          skill: skill.required,
          category: skill.category,
          priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
          reason: this.getRecommendationReason(skill),
          resources: this.getLearningSuggestions(skill.required, skill.category)
        });
      });

    return recommendations;
  }

  /**
   * Get recommendation reason
   * @param {Object} skill - Missing skill
   * @returns {string} Recommendation reason
   */
  getRecommendationReason(skill) {
    const categoryReasons = {
      'Programming Languages': 'Core programming skill required for this role',
      'Frontend': 'Essential for user interface development',
      'Backend': 'Critical for server-side development',
      'Databases': 'Required for data management and storage',
      'Cloud & DevOps': 'Important for modern deployment and scaling',
      'Data Science': 'Essential for data analysis and ML tasks',
      'Soft Skills': 'Important for effective collaboration and leadership',
      'Other': 'Additional skill that would be beneficial'
    };

    return categoryReasons[skill.category] || 'Skill mentioned in job requirements';
  }

  /**
   * Get learning suggestions for a skill
   * @param {string} skillName - Skill name
   * @param {string} category - Skill category
   * @returns {Array} Learning resources
   */
  getLearningSuggestions(skillName, category) {
    const suggestions = {
      'Programming Languages': [
        'Online coding bootcamps',
        'Interactive coding platforms (Codecademy, freeCodeCamp)',
        'Official documentation and tutorials',
        'Practice with personal projects'
      ],
      'Frontend': [
        'Build sample applications',
        'Component libraries documentation',
        'Design system tutorials',
        'Responsive design courses'
      ],
      'Backend': [
        'API development tutorials',
        'Database integration projects',
        'Microservices architecture courses',
        'Server deployment guides'
      ],
      'Databases': [
        'Database design fundamentals',
        'Query optimization tutorials',
        'Practice with sample datasets',
        'Database administration courses'
      ],
      'Cloud & DevOps': [
        'Cloud provider certification paths',
        'Container orchestration tutorials',
        'CI/CD pipeline implementation',
        'Infrastructure as Code practices'
      ],
      'Data Science': [
        'Online ML courses (Coursera, edX)',
        'Kaggle competitions',
        'Data analysis projects',
        'Statistics and mathematics review'
      ],
      'Soft Skills': [
        'Leadership development programs',
        'Communication workshops',
        'Project management certification',
        'Team collaboration training'
      ]
    };

    return suggestions[category] || [
      'Search for online tutorials',
      'Practice with hands-on projects',
      'Join relevant communities',
      'Consider formal training'
    ];
  }

  /**
   * Get match quality description
   * @param {number} score - Match score (0-1)
   * @returns {string} Quality description
   */
  getMatchQuality(score) {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    if (score >= 0.4) return 'Below Average';
    return 'Poor';
  }

  /**
   * Get skill suggestions based on partial input
   * @param {string} partialSkill - Partial skill name
   * @param {number} limit - Maximum suggestions
   * @returns {Array} Skill suggestions
   */
  getSkillSuggestions(partialSkill, limit = 10) {
    const normalized = this.normalizeSkill(partialSkill);
    const suggestions = [];

    this.skillDatabase.forEach((skillData, canonical) => {
      if (canonical.includes(normalized) || 
          skillData.name.toLowerCase().includes(partialSkill.toLowerCase())) {
        suggestions.push({
          name: skillData.name,
          category: skillData.category,
          canonical
        });
      }
    });

    // Check synonyms
    this.skillSynonyms.forEach((canonical, synonym) => {
      if (synonym.includes(normalized)) {
        const skillData = this.skillDatabase.get(canonical);
        if (skillData && !suggestions.find(s => s.canonical === canonical)) {
          suggestions.push({
            name: skillData.name,
            category: skillData.category,
            canonical
          });
        }
      }
    });

    return suggestions
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }
}

// Create singleton instance
export const skillMatchingService = new SkillMatchingService();
export default skillMatchingService;
