import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import Klogo from '../assets/KLOGO.png';

function LegalHeader({ $isDarkMode, isDarkMode }) {
  const dark = $isDarkMode ?? isDarkMode;
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const from = (params.get('from') || '').toLowerCase();
  const target = from === 'register' ? '/register' : '/';
  const title = from === 'register' ? 'Back to Sign up' : 'Back to Sign in';
  return (
    <div className={`${dark ? 'bg-orange-50/5' : 'bg-orange-50'} border-b ${dark ? 'border-white/10' : 'border-orange-100'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 py-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(target)}
          title={title}
          aria-label={title}
          className="flex items-center gap-3 group"
        >
          <img src={Klogo} alt="kGamify" className="w-8 h-8 rounded" />
          <div className={`text-lg font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'} group-hover:underline`}>kGamify</div>
        </button>
      </div>
    </div>
  );
}

LegalHeader.propTypes = {
  $isDarkMode: PropTypes.bool,
  isDarkMode: PropTypes.bool,
};

export default LegalHeader;
