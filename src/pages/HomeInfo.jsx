import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Klogo from '../assets/KLOGO.png';

const WEBSITE_URL = 'https://kgamify-job.onrender.com/';

export default function HomeInfo({ isDarkMode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(120deg, #fff7e6 0%, #ffecd2 40%, #ffe3b3 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, #ffb34733 0%, transparent 60%), radial-gradient(circle at 20% 80%, #ff820033 0%, transparent 60%)',
            opacity: 0.7,
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <img
            src={Klogo}
            alt="kGamify Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent">
            Welcome to kGamify Job Portal
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-800 max-w-3xl mx-auto">
            A complete hiring platform for companies to post jobs, manage applications,
            use AI for better job descriptions, and streamline recruiting from one dashboard.
          </p>
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 text-sm sm:text-base font-semibold text-[#e57400] underline"
          >
            {WEBSITE_URL}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-lg text-[#ff8200] mb-2">Smart AI Features</h2>
            <p className="text-sm text-gray-700">
              AI-powered job description suggestions, text rephrasing, spell correction,
              and assistant support to improve quality and save time.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-lg text-[#ff8200] mb-2">Hiring Workflow</h2>
            <p className="text-sm text-gray-700">
              Post jobs, receive applications, review resumes, track candidate status,
              and communicate with applicants in one organized flow.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-lg text-[#ff8200] mb-2">Admin & Billing</h2>
            <p className="text-sm text-gray-700">
              Dedicated admin controls, company approval management, API tools,
              subscription plans, and professional invoice support.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-xl text-center">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Get Started</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-6">
            New here? Create your company account. Already registered? Sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff8200] to-[#ffb347] hover:from-[#e57400] hover:to-[#ffb347]"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl font-bold border-2 border-[#ff8200] text-[#ff8200] hover:bg-orange-50"
            >
              Register
            </Link>
            <Link
              to="/admin-login"
              className="px-6 py-3 rounded-xl font-bold border-2 border-gray-800 text-gray-800 hover:bg-gray-100"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

HomeInfo.propTypes = {
  isDarkMode: PropTypes.bool,
};
