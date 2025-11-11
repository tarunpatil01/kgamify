import PropTypes from 'prop-types';
import { FaUserCircle, FaKey, FaLock } from 'react-icons/fa';
import { useState } from 'react';
import { changeAdminPassword } from '../api';

export default function AdminProfile({ isDarkMode, $isDarkMode }){
  const dark = $isDarkMode ?? isDarkMode ?? false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const admin = (()=>{ try { return JSON.parse(localStorage.getItem('adminData')||'null'); } catch { return null; } })();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match'); return; }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters long'); return; }
    setIsLoading(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || error.error || 'Error changing password');
    } finally { setIsLoading(false); }
  };

  return (
    <div className={`min-h-[60vh] px-4 py-6 ${dark ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className={`${dark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm`}>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              <FaUserCircle className="text-[#ff8200] text-6xl" />
            </div>
            <h3 className="text-2xl font-bold mt-3">{admin?.firstName || 'System'} {admin?.lastName || 'Admin'}</h3>
            <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{admin?.email}</p>
          </div>
        </div>

        <div className={`${dark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm`}>
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FaKey className="mr-2 text-[#ff8200]" /> Change Password
          </h3>
          {passwordError && (
            <div className={`mb-4 p-3 rounded ${dark ? 'bg-red-900/30 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>{passwordError}</div>
          )}
          <form onSubmit={handlePasswordChange} className="max-w-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className={`w-full px-4 py-3 border rounded ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required />
                <FaLock className="absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={`w-full px-4 py-3 border rounded ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required minLength={6} />
                <FaLock className="absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={`w-full px-4 py-3 border rounded ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required minLength={6} />
                <FaLock className="absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className={`w-full py-3 px-4 rounded font-medium text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#ff8200] hover:bg-[#e67600]'} flex items-center justify-center`}>
              {isLoading ? 'Updating...' : (<><FaKey className="mr-2"/> Change Password</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

AdminProfile.propTypes = { isDarkMode: PropTypes.bool, $isDarkMode: PropTypes.bool };
