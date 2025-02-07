import React from "react";

function Footer({ isDarkMode }) {
  return (
    <footer className={`text-center p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-800 text-white"}`}>
      <p>© 2021 All Rights Reserved to Kgamify | Version 0.1</p>
    </footer>
  );
}

export default Footer;
