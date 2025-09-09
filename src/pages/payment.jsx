import PropTypes from 'prop-types';

export default function Payment({ isDarkMode }) {
  return (
    <div
      className={`min-h-screen py-10 px-2 sm:px-6 lg:px-8 flex flex-col items-center ${
        isDarkMode
          ? 'bg-gray-900 text-white'
          : 'bg-gray-50 text-black'
      }`}
    >
      <div className="w-full max-w-2xl mx-auto rounded-2xl shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Payment</h1>
        <div className="w-full text-center text-lg font-medium mb-4">
          {/* Placeholder for payment details or integration */}
          Payment functionality coming soon.
        </div>
        <div className="w-full flex flex-col gap-4 items-center">
          {/* You can add payment form, history, or integration here */}
        </div>
      </div>
    </div>
  );
}

Payment.propTypes = {
  isDarkMode: PropTypes.bool,
};
