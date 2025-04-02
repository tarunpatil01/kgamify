import React, { useState } from 'react';
import axios from 'axios';
import { 
  Button, 
  Box, 
  Typography,
  CircularProgress 
} from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import VisibilityIcon from '@material-ui/icons/Visibility';

const CompanyDocumentViewer = ({ companyId, companyName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use the direct download endpoint for better Edge browser compatibility
      window.location.href = `/api/company/document/direct-download/${companyId}`;
      
      // After a short delay, reset loading state
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to download document:', err);
      setError('Failed to download the document. Please try again.');
      setLoading(false);
    }
  };
  
  const handleView = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/company/document/link/${companyId}`);
      
      if (response.data && response.data.documentUrl) {
        // Open document in new tab for viewing
        window.open(response.data.documentUrl, '_blank');
      } else {
        setError('Could not retrieve document URL.');
      }
    } catch (err) {
      console.error('Failed to view document:', err);
      setError('Failed to view the document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={2}>
      <Typography variant="subtitle1">Company Documents</Typography>
      <Box mt={1} display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<GetAppIcon />}
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Download Document'}
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<VisibilityIcon />}
          onClick={handleView}
          disabled={loading}
        >
          View Document
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CompanyDocumentViewer;
