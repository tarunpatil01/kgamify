import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

function getSessionEmail() {
  try { return sessionStorage.getItem('sessionEmail') || ''; } catch { return ''; }
}

function getRememberedEmail() {
  try { return localStorage.getItem('rememberedEmail') || ''; } catch { return ''; }
}

function getCompanyDataEmail() {
  try {
    const cd = JSON.parse(localStorage.getItem('companyData') || 'null');
    return cd?.email || '';
  } catch { return ''; }
}

export default function RequireCompanyAuth({ children }) {
  const location = useLocation();
  const email = getSessionEmail() || getRememberedEmail() || getCompanyDataEmail();

  if (!email) {
    // No company email found; route to login
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

RequireCompanyAuth.propTypes = {
  children: PropTypes.node,
};
