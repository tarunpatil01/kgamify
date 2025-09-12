import PropTypes from 'prop-types';

function Footer({ isDarkMode }) {
  return (
    <footer className={`text-center p-3 sm:p-4 ${isDarkMode ? "bg-kgamify-footer-900 text-white" : "bg-kgamify-footer-900 text-white"} mt-auto text-xs sm:text-sm`}>
  <p>Copyright © 2021 Yantrikisoft - All Rights Reserved.</p>
    </footer>
  );
}

Footer.propTypes = {
  isDarkMode: PropTypes.bool.isRequired
};

export default Footer;
