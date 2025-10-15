// components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { updateUsername, updatePassword } from '@/lib/profile/userdetails';
import { Button } from '@/components/custom-ui/button2';
import SmartInputBox from '@/components/custom-ui/input-box'; 

interface UserData {
  employee_id: number;
  username: string;
  email: string;
  designation: string;
  permissions?: {
    admin?: boolean;
    brands?: Record<string, Record<string, string[]>>;
    settings?: boolean;
    reportrix?: Record<string, string[]>;
    brand_admin?: boolean;
    reportrix_admin?: boolean;
    invite_level?: string | false;
  } | null;
  people: Array<{
    employee_id: number;
    username: string;
  }>;
  dropdowns: {
    brand_name: string[];
    role: string[];
    format_type: string[];
    top_pointers: string[];
    post_type: string[];
    marketing_funnel: string[];
    status: string[];
    ads_type: string[];
  };
}

interface UserProfileProps {
  userData?: UserData | null;
}

export default function UserProfile({ userData: initialUserData }: UserProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(initialUserData || null);
  const [loading, setLoading] = useState(!initialUserData);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: false,
    contentPermissions: false,
    dataPermissions: false
  });
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(initialUserData?.username || '');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch user data if not provided as prop
    if (initialUserData) {
      setUserData(initialUserData);
      setEditedName(initialUserData.username);
      // Initialize all brands as collapsed
      const initialExpandedBrands: Record<string, boolean> = {};
<<<<<<< HEAD
      if (initialUserData.permissions?.brands) {
        Object.keys(initialUserData.permissions.brands).forEach(brand => {
          initialExpandedBrands[brand] = false;
        });
      }
=======
      Object.keys(initialUserData.permissions.brands).forEach(brand => {
        initialExpandedBrands[brand] = false;
      });
>>>>>>> 3dc4f4ea5d7c542adcfdb58b9dbff888e9c880b1
      setExpandedBrands(initialExpandedBrands);
      setLoading(false);
      return;
    }

    // If no userData provided as prop, show error
    setError('No user data provided');
    setLoading(false);
  }, [initialUserData]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !userData) {
    return <div className="p-4 text-red-500">{error || 'No user data available'}</div>;
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brand]: !prev[brand]
    }));
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editedName.trim() || !userData) return;

    try {
      setIsUpdating(true);
      setUpdateMessage(null);

      const result = await updateUsername(userData.employee_id, editedName.trim());

      // Update local state with new username
      setUserData(prev => prev ? { ...prev, username: result.username } : null);
      setIsEditingName(false);
      setUpdateMessage('Username updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Error updating username:', error);
      setUpdateMessage(error instanceof Error ? error.message : 'Failed to update username');
      setEditedName(userData.username); // Reset to original name
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!userData || !passwordData.currentPassword || !passwordData.newPassword) {
      setUpdateMessage('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setUpdateMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setUpdateMessage('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateMessage(null);

      await updatePassword(
        userData.employee_id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      setUpdateMessage('Password updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setUpdateMessage(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setUpdateMessage(null);
  };

  // Generate initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <div className="w-full p-4 bg-white">
      {/* Profile Section */}
      <div className="mb-4 border border-gray-300 rounded-lg">
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-300 rounded-t-lg">
          <h2 className="text-sm font-medium">Profile Section</h2>
        </div>

        <div className="p-6 bg-white relative rounded-b-lg">
          {/* Profile Layout */}
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-20 h-20 mt-2 bg-white border-2 border-gray-800 rounded-[10px] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-gray-800">
                {getInitials(userData.username)}
              </span>
            </div>

            {/* Profile Data */}
            <div className="flex-1 space-y-4">
              {/* Name Section */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium w-20">NAME</div>
                {isEditingName ? (
                  <form className="flex items-center flex-1" onSubmit={handleSaveName}>
                    <SmartInputBox
                      value={editedName}
                      onChange={setEditedName}
                      placeholder="Enter username"
                      className="flex-1"
                      inputClassName="border border-gray-300 rounded px-2 py-1 text-gray-900 text-sm font-medium disabled:opacity-50"
                      readOnly={isUpdating}
                    />
                    <Button
                      type="submit"
                      disabled={isUpdating || !editedName.trim()}
                      variant="primary"
                      size="s"
                      className="ml-2"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditedName(userData.username);
                        setIsEditingName(false);
                        setUpdateMessage(null);
                      }}
                      disabled={isUpdating}
                      variant="gray"
                      size="s"
                      className="ml-1"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center flex-1">
                    <div className="text-sm font-medium text-gray-900 flex-1">{userData.username}</div>
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="icon"
                      size="none"
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>

              {/* Role Section */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium w-20">ROLE</div>
                <div className="text-sm font-medium text-gray-900 flex-1">{userData.designation}</div>
              </div>

              {/* Email Section */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium w-20">E-MAIL ID</div>
                <div className="text-sm text-gray-900 flex-1">{userData.email}</div>
              </div>

              {/* Password Section - removed from here */}
            </div>
          </div>

          {/* word Button - Bottom Right */}
          <div className="relative bottom-5 right-0 flex justify-end">
            <Button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              variant="outline"
              size="s"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              {isChangingPassword ? 'Cancel password change' : 'Change password'}
            </Button>
          </div>

          {/* Password Change Section */}
          {isChangingPassword && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div 
                className="grid grid-cols-3 gap-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isUpdating && passwordData.currentPassword && passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
                    handlePasswordChange();
                  }
                }}
              >
                <div>
                  <SmartInputBox
                    value={passwordData.currentPassword}
                    onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                    placeholder="Enter current password"
                    label="Current Password"
                    readOnly={isUpdating}
                    inputClassName="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 disabled:opacity-50"
                  />
                </div>

                <div>
                  <SmartInputBox
                    value={passwordData.newPassword}
                    onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                    placeholder="Enter new password"
                    label="New Password"
                    readOnly={isUpdating}
                    inputClassName="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 disabled:opacity-50"
                  />
                </div>

                <div>
                  <SmartInputBox
                    value={passwordData.confirmPassword}
                    onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                    placeholder="Confirm new password"
                    label="Confirm New Password"
                    readOnly={isUpdating}
                    inputClassName={`w-full bg-white border rounded px-3 py-2 text-gray-900 disabled:opacity-50 ${ 
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                        ? 'border-red-500' 
                        : 'border-gray-300' 
                    }`}
                    validate={(value) => {
                      if (value && passwordData.newPassword !== value) {
                        return { message: 'Passwords do not match', type: 'error' };
                      }
                      return null;
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isUpdating || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  variant="primary"
                  size="s"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  onClick={handleCancelPasswordChange}
                  disabled={isUpdating}
                  variant="gray"
                  size="s"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {updateMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${ 
              updateMessage.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200' 
            }`}>
              {updateMessage}
            </div>
          )}
        </div>
      </div>

      {/* Content Permissions Section - Only show if there are brands with permissions */}
<<<<<<< HEAD
      {userData.permissions?.brands && Object.keys(userData.permissions.brands).some(brand => {
        const brandPermissions = userData.permissions?.brands?.[brand];
        return brandPermissions && Object.keys(brandPermissions).some(formatType => {
=======
      {Object.keys(userData.permissions.brands).some(brand => {
        const brandPermissions = userData.permissions.brands[brand];
        return Object.keys(brandPermissions).some(formatType => {
>>>>>>> 3dc4f4ea5d7c542adcfdb58b9dbff888e9c880b1
          const permissions = brandPermissions[formatType];
          return Array.isArray(permissions) && permissions.length > 0;
        });
      }) && (
        <div className="mb-4 border border-gray-300 rounded-lg">
          <div
            className={`flex justify-between items-center p-3 bg-gray-50 cursor-pointer ${
              expandedSections.contentPermissions 
                ? 'border-b border-gray-300 rounded-t-lg' 
                : 'rounded-lg'
            }`}
            onClick={() => toggleSection('contentPermissions')}
          >
            <h2 className="text-sm font-medium">Content Permissions</h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${expandedSections.contentPermissions ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.contentPermissions && (
            <div className="p-4 space-y-3 rounded-b-lg">
              {userData.permissions?.brands && Object.keys(userData.permissions.brands).filter(brand => {
                // Only show brands that have at least one permission assigned
<<<<<<< HEAD
                const brandPermissions = userData.permissions?.brands?.[brand];
                return brandPermissions && Object.keys(brandPermissions).some(formatType => {
=======
                const brandPermissions = userData.permissions.brands[brand];
                return Object.keys(brandPermissions).some(formatType => {
>>>>>>> 3dc4f4ea5d7c542adcfdb58b9dbff888e9c880b1
                  const permissions = brandPermissions[formatType];
                  return Array.isArray(permissions) && permissions.length > 0;
                });
              }).map(brand => (
                <div key={brand} className="border border-gray-300 rounded-md">
                  <div
                    className={`flex justify-between items-center p-2 bg-gray-100 cursor-pointer ${
                      expandedBrands[brand] 
                        ? 'rounded-t-md' 
                        : 'rounded-md'
                    }`}
                    onClick={() => toggleBrand(brand)}
                  >
                    <span className="text-sm font-medium text-gray-700">{brand}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${expandedBrands[brand] ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expandedBrands[brand] && (
                    <div className="border-t border-gray-300 rounded-b-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                              Permissions
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
<<<<<<< HEAD
                          {userData.permissions?.brands?.[brand] && Object.keys(userData.permissions.brands[brand]).filter(formatType => {
=======
                          {Object.keys(userData.permissions.brands[brand]).filter(formatType => {
>>>>>>> 3dc4f4ea5d7c542adcfdb58b9dbff888e9c880b1
                            // Only show format types that have permissions
                            const permissions = userData.permissions?.brands?.[brand]?.[formatType];
                            return Array.isArray(permissions) && permissions.length > 0;
                          }).map(formatType => (
                            <tr key={formatType}>
                              <td className="px-3 py-2 text-sm text-center  text-gray-900 border-r border-gray-300">
                                {formatType}
                              </td>
                              <td className="px-3 py-2 text-sm text-center text-gray-900">
                                {userData.permissions?.brands?.[brand]?.[formatType]?.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Permissions Section - Only show if there are brands with permissions */}
<<<<<<< HEAD
      {userData.permissions?.reportrix && Object.keys(userData.permissions.reportrix).some(brand => {
        const permissions = userData.permissions?.reportrix?.[brand];
=======
      {Object.keys(userData.permissions.reportrix).some(brand => {
        const permissions = userData.permissions.reportrix[brand];
>>>>>>> 3dc4f4ea5d7c542adcfdb58b9dbff888e9c880b1
        const permissionArray = Array.isArray(permissions) ? permissions : [];
        return permissionArray.length > 0;
      }) && (
        <div className="border border-gray-300 rounded-lg">
          <div
            className={`flex justify-between items-center p-3 bg-gray-50 cursor-pointer ${
              expandedSections.dataPermissions 
                ? 'border-b border-gray-300 rounded-t-lg' 
                : 'rounded-lg'
            }`}
            onClick={() => toggleSection('dataPermissions')}
          >
            <h2 className="text-sm font-medium">Data Permissions</h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${expandedSections.dataPermissions ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.dataPermissions && (
            <div className="p-4 space-y-3 rounded-b-lg">
              {userData.permissions?.reportrix && Object.keys(userData.permissions.reportrix).filter(brand => {
                // Only show brands that have at least one permission assigned
                const permissions = userData.permissions?.reportrix?.[brand];
                const permissionArray = Array.isArray(permissions) ? permissions : [];
                return permissionArray.length > 0;
              }).map(brand => {
                // Ensure the permissions value is an array
                const permissions = userData.permissions?.reportrix?.[brand];
                const permissionArray = Array.isArray(permissions) ? permissions : [];
                
                return (
                  <div key={brand} className="flex justify-between items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{brand}</span>
                    <div className="flex gap-2">
                      {permissionArray.map(permission => (
                        <Button
                          key={permission}
                          variant="outline"
                          size="s"
                        >
                          {permission}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}