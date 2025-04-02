import React from 'react';
import { Button } from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/GetApp';
import axios from 'axios';

const DocumentDownloadButton = ({ companyId, buttonText = 'Download Document' }) => {
  const downloadDocument = async () => {
    try {
      // First get the document URL
      const response = await axios.get(`/api/company/document/link/${companyId}`);
      const { documentUrl, fileName } = response.data;
      
      // Create a hidden anchor element to trigger the download
      const link = document.createElement('a');
      link.href = `/api/company/document/download/${companyId}`;
      
      // Force download attribute for better browser compatibility
      link.setAttribute('download', fileName || 'document');
      link.setAttribute('target', '_blank'); // Try opening in new tab if download fails
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Small delay before removing to ensure the download starts
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={downloadDocument}
    >
      {buttonText}
    </Button>
  );
};

export default DocumentDownloadButton;
