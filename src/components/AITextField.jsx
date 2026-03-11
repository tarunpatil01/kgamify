import { useState, useEffect, useCallback } from 'react';
import { TextField, IconButton, Chip, Collapse, Alert } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * AI-Enhanced Text Field with real-time spell check
 * Shows suggestions and Fix button for spelling errors
 */
export default function AITextField({ 
  label, 
  value, 
  onChange, 
  placeholder,
  error,
  helperText,
  required,
  ...otherProps 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [checkingTimer, setCheckingTimer] = useState(null);

  // Check for suggestions after user stops typing
  const checkSuggestions = useCallback(async (text) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, field: 'jobTitle' })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.hasIssues || false);
      }
    } catch (error) {
      console.error('Suggestion check failed:', error);
      setSuggestions([]);
    }
  }, []);

  // Debounce: check suggestions 1 second after user stops typing
  useEffect(() => {
    if (checkingTimer) {
      clearTimeout(checkingTimer);
    }

    const timer = setTimeout(() => {
      checkSuggestions(value);
    }, 1000);

    setCheckingTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [value, checkSuggestions]);

  // Fix button handler
  const handleFix = async () => {
    if (!value) return;

    setIsFixing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/ai/rephrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Call onChange with the rephrased text
        if (onChange && data.rephrased) {
          onChange({ target: { value: data.rephrased } });
        }
        
        // Clear suggestions after fixing
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        console.error('Fix failed:', response.statusText);
      }
    } catch (error) {
      console.error('Fix error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const hasIssues = suggestions.length > 0;
  const issueCount = suggestions.length;

  return (
    <div className="mb-4">
      <div className="relative">
        <TextField
          fullWidth
          label={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          {...otherProps}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: hasIssues ? '#facc15' : undefined,
                borderWidth: hasIssues ? 2 : 1,
              },
            },
          }}
          InputProps={{
            endAdornment: hasIssues && (
              <div className="flex items-center gap-2">
                <Chip 
                  label={`${issueCount} issue${issueCount > 1 ? 's' : ''}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
                <IconButton
                  onClick={handleFix}
                  disabled={isFixing}
                  size="small"
                  color="primary"
                  title="Fix issues"
                >
                  <AutoFixHighIcon />
                </IconButton>
              </div>
            ),
          }}
        />
      </div>

      {/* Suggestions dropdown */}
      <Collapse in={showSuggestions}>
        <div className="mt-2">
          {suggestions.map((suggestion, index) => (
            <Alert
              key={index}
              severity={
                suggestion.severity === 'high' ? 'error' : 
                suggestion.severity === 'medium' ? 'warning' : 
                'info'
              }
              onClose={() => {
                setSuggestions(prev => prev.filter((_, i) => i !== index));
                if (suggestions.length === 1) setShowSuggestions(false);
              }}
              icon={
                suggestion.type === 'spelling' ? '📝' :
                suggestion.type === 'grammar' ? '✏️' : '💡'
              }
              sx={{ mb: 1 }}
            >
              <div>
                <div className="font-medium">{suggestion.message}</div>
                {suggestion.suggestion && (
                  <div className="text-sm opacity-80 mt-1">
                    {suggestion.suggestion}
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </Collapse>
    </div>
  );
}

AITextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};
