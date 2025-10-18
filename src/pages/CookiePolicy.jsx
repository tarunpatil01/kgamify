import PropTypes from 'prop-types';
import Footer from "../components/Footer";
import LegalHeader from "../components/LegalHeader";

function CookiePolicy({ $isDarkMode, isDarkMode }) {
  const dark = $isDarkMode ?? isDarkMode;
  const textCls = dark ? "text-gray-200" : "text-gray-800";
  const subTextCls = dark ? "text-gray-300" : "text-gray-700";
  const containerCls = dark
    ? "bg-gray-900 text-gray-100"
    : "bg-white text-gray-900";

  return (
    <div className={`min-h-screen flex flex-col ${containerCls}`}>
      <LegalHeader $isDarkMode={dark} isDarkMode={dark} />
      <main className="flex-1">
  <div className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-8">
          <h1 className={`text-3xl font-bold mb-2 ${textCls}`}>Cookie Policy</h1>
          <p className={`mb-6 ${subTextCls}`}>
            <span className="font-semibold">Effective Date:</span> July 18, 2025
          </p>
          <p className={`mb-6 leading-relaxed ${textCls}`}>
            This document explains how kGamify (&#34;Yantrikisoft Pvt. Ltd.&#34;, &#34;we&#34;, &#34;our&#34; or &#34;us&#34;) uses cookies and similar tracking technologies on the kGamify platform (&#34;Platform&#34;). By accessing or using kGamify, you agree to this Cookie Policy, which operates in conjunction with our Privacy Policy and Terms of Use.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>What Are Cookies?</h2>
          <p className={subTextCls}>
            Cookies are small files placed on your device when you visit our Platform. They help improve our services, personalise your experience, and support Platform security and analytics.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Types of Cookies We Use</h2>
          <ol className={`${subTextCls} list-decimal pl-6 space-y-4`}>
            <li>
              <p className="font-semibold">Strictly Necessary Cookies</p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Required for operation of the Platform.</li>
                <li>Enable essential features such as secure log-in and navigation.</li>
              </ul>
            </li>
            <li>
              <p className="font-semibold">Performance and Analytics Cookies</p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Help us understand how you use the Platform, including pages viewed and errors encountered.</li>
                <li>Used for platform analytics, improvement, and optimisation.</li>
              </ul>
            </li>
            <li>
              <p className="font-semibold">Functionality Cookies</p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Remember user preferences (e.g., language or region) to improve your experience.</li>
              </ul>
            </li>
            <li>
              <p className="font-semibold">Targeting/Advertising Cookies</p>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>May be used to deliver advertisements relevant to you and assess ad performance.</li>
                <li>We do not share or sell personal data for third-party marketing without your consent.</li>
              </ul>
            </li>
          </ol>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>How We Use Cookies</h2>
          <ul className={`${subTextCls} list-disc pl-6 space-y-1`}>
            <li><span className="font-semibold">Personalisation:</span> To remember user preferences and account settings.</li>
            <li><span className="font-semibold">Security:</span> To identify security issues and protect your information.</li>
            <li><span className="font-semibold">Analytics:</span> To analyse aggregate usage and enhance Platform features.</li>
            <li><span className="font-semibold">Compliance:</span> To satisfy legal and regulatory obligations.</li>
          </ul>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Managing Cookies</h2>
          <p className={subTextCls}>
            On first visit, you may receive a prompt to accept or manage cookies (where required by law). You may also configure your browser to block or delete cookies at any time; however, this may impact site functionality.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Third-Party Cookies</h2>
          <p className={subTextCls}>
            Some cookies may be set by external services we use for analytics, security, or functionality. We do not authorize any third party to use cookies for their own purposes outside provision of their service to kGamify.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Data Sharing and Retention</h2>
          <p className={subTextCls}>
            We do not sell or misuse your personally identifiable information. We may share aggregated or anonymized data with partners for analytics or business development.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Policy Changes</h2>
          <p className={subTextCls}>
            We may update this Cookie Policy from time to time. Review this page periodically for changes. Continued use of our Platform after amendments signifies your consent to revised terms.
          </p>

          <h2 className={`text-xl font-semibold mt-8 mb-3 ${textCls}`}>Contact Us</h2>
          <address className={`${subTextCls} not-italic`}>
            Yantrikisoft Pvt. Ltd.<br />
            D207, Shabi Complex, Plot 110-111<br />
            Sector 12, Vashi, Navi Mumbai – 400703, India
          </address>
          <p className={`mt-3 ${subTextCls}`}>
            For queries, see contact options in our Privacy Policy.
          </p>

          <p className={`mt-6 ${subTextCls}`}>
            This Cookie Policy is to be read in conjunction with our Privacy Policy and Terms of Use.
          </p>
        </div>
      </main>

      <Footer isDarkMode={dark} $isDarkMode={dark} />
    </div>
  );
}

CookiePolicy.propTypes = {
  $isDarkMode: PropTypes.bool,
  isDarkMode: PropTypes.bool,
};

export default CookiePolicy;
