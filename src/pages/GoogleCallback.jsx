import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Assuming the backend sets a token in localStorage or handles session
    // You might want to fetch user data or validate the token here
    navigate('/google-register');
  }, [navigate]);

  return <div>Loading...</div>;
};

export default GoogleCallback;
