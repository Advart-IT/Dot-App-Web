import { useState, useEffect } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import SmartDropdowithadd from '@/components/custom-ui/dropdown-with-add';
import { Button } from '@/components/custom-ui/button2';
import { inviteUser, toggleUserStatus, updateUserPermissions, createNewBrand, createNewDesignation } from '@/lib/profile/manage';
import { fetchUserPermissions } from '@/lib/profile/admin';
import type { UserData } from './AdminSection';

interface ManageSectionProps {
  userData: UserData;
}

export default function ManageSection({ userData }: ManageSectionProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedInviteLevel, setSelectedInviteLevel] = useState<string>('false');
  const [manageActivityEnabled, setManageActivityEnabled] = useState<boolean>(true);
  const [adminAccessEnabled, setAdminAccessEnabled] = useState<boolean>(false);
  
  // Stats permissions states
  const [statsPeopleEnabled, setStatsPeopleEnabled] = useState<boolean>(false);
  const [selectedStatsContent, setSelectedStatsContent] = useState<string[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  
  // User permissions and current user data
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  
  // Current user's invite level (from context/props)
  const currentUserInviteLevel = currentUserData?.permissions?.invite_level || userData.permissions?.invite_level || false;
  
  // Invite level options (for permission changes) - include false option
  const inviteLevelOptions = [
    { label: 'False', value: 'false' },
    { label: 'Own Brand', value: 'own_brand' },
    { label: 'Any Brand', value: 'any_brand' }
  ];

  // Stats content options (hardcoded values)
  const statsContentOptions = [
    { label: 'Social Media', value: 'Social_media' },
    { label: 'Ads', value: 'Ads' }
  ];

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [selectedInviteBrands, setSelectedInviteBrands] = useState<string[]>([]); // Changed initial value
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);

  // Create user options from userData.people
  const userOptions = userData.people?.map(person => ({
    label: person.username,
    value: person.username
  })) || [];

  // Create invite brand options from actual brand names including advart
  const inviteBrandOptions = [
    { label: 'Advart', value: 'advart' },
    ...(userData.dropdowns?.brand_name?.map(brand => ({
      label: brand.charAt(0).toUpperCase() + brand.slice(1),
      value: brand
    })) || [])
  ];

  // Create designation options from userData.dropdowns.designation
  const designationOptions = userData.dropdowns?.designation?.map((designation: any) => {
    return ({
      label: designation,
      value: designation
    });
  }) || [];

  const handleUserChange = (val: string | string[]) => {
    const username = val as string;
    setSelectedUser(username);
    
    // Find user ID from userData.people
    const user = userData.people?.find(person => person.username === username);
    if (user) {
      setSelectedUserId(user.employee_id);
    } else {
      setSelectedUserId(null);
    }
  };

  const handleInviteLevelChange = (val: string | string[]) => {
    const value = val as string;
    setSelectedInviteLevel(value);
  };

  // Don't auto-select any user initially - let user choose
  // useEffect(() => {
  //   if (userData.people && userData.people.length > 0 && !selectedUser) {
  //     const firstUser = userData.people[0];
  //     setSelectedUser(firstUser.username);
  //     setSelectedUserId(firstUser.employee_id);
  //   }
  // }, [userData.people, selectedUser]);

  // Load user permissions and current user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Use user data from context instead of fetching
        setCurrentUserData(userData);
        
        // Load selected user's permissions if a user is selected
        if (selectedUserId) {
          // Fetch all permissions first
          const permissions = await fetchUserPermissions(selectedUserId, 'all');
          setUserPermissions(permissions.permissions);
          
          // Update toggle states based on actual user permissions
          setAdminAccessEnabled(permissions.permissions?.admin || false);
          setSelectedInviteLevel(permissions.permissions?.invite_level || 'false');
          setManageActivityEnabled(true); // Assuming active if user is loaded
          
          // Update stats permissions from the fetched data
          console.log('Loaded user permissions:', permissions.permissions);
          console.log('Stats section:', permissions.permissions?.Stats);
          setStatsPeopleEnabled(permissions.permissions?.Stats?.people || false);
          setSelectedStatsContent(permissions.permissions?.Stats?.content || []);
        } else {
          // Reset to initial values when no user is selected
          setAdminAccessEnabled(false);
          setSelectedInviteLevel('false');
          setManageActivityEnabled(true);
          setStatsPeopleEnabled(false);
          setSelectedStatsContent([]);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        alert('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [selectedUserId, userData]);

  const handleAddNewBrand = async (newBrandName: string) => {
    if (!newBrandName.trim()) {
      alert('Please enter a brand name');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating new brand:', newBrandName.trim());
      
      // Call API to create new brand
      await createNewBrand(newBrandName.trim());
      
      alert('Brand created successfully!');
      
      // Optionally, you might want to refresh the page or update the dropdown options
      // For now, we'll just show success message
      
    } catch (error) {
      console.error('Failed to create brand:', error);
      alert(error instanceof Error ? error.message : 'Failed to create brand');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewDesignation = async (newDesignationName: string) => {
    if (!newDesignationName.trim()) {
      alert('Please enter a designation name');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating new designation:', newDesignationName.trim());
      
      // Call API to create new designation
      await createNewDesignation(newDesignationName.trim());
      
      alert('Designation created successfully!');
      
      // Optionally, you might want to refresh the page or update the dropdown options
      // For now, we'll just show success message
      
    } catch (error) {
      console.error('Failed to create designation:', error);
      alert(error instanceof Error ? error.message : 'Failed to create designation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    // Check if user has invite permissions
    if (currentUserInviteLevel === false || currentUserInviteLevel === 'false') {
      alert('You do not have permission to send invites');
      return;
    }
    
    // For any_brand: check if brand selection is required
    if (currentUserInviteLevel === 'any_brand' && selectedInviteBrands.length === 0) {
      alert('Please select a brand');
      return;
    }
    
    // Check if designation is selected
    if (!selectedDesignation.trim()) {
      alert('Please select a designation');
      return;
    }
    
    try {
      setInviteLoading(true);
      
      let departmentToSend: string;
      
      if (currentUserInviteLevel === 'any_brand') {
        // Use the selected brand from dropdown
        const selectedBrandValue = selectedInviteBrands[0];
        departmentToSend = selectedBrandValue; // Pass the brand value directly
      } else {
        // For own_brand: use the department from current user's data
        departmentToSend = String(currentUserData?.depatment || 'Advart');
      }
      
      console.log('=== handleSendInvite Debug ===');
      console.log('Current user invite level:', currentUserInviteLevel);
      console.log('Selected brand value:', selectedInviteBrands[0]);
      console.log('Selected designation:', selectedDesignation);
      console.log('Department to send:', departmentToSend);
      console.log('Email to send:', inviteEmail.trim());
      
      // Call API with email, department, and designation
      await inviteUser(inviteEmail.trim(), departmentToSend, selectedDesignation.trim());
      
      alert('Invitation sent successfully!');
      
      // Reset and close modal
      setInviteEmail('');
      setSelectedInviteBrands([]);
      setSelectedDesignation('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invite:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAdminAccessToggle = async (enabled: boolean) => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    const confirmMessage = enabled 
      ? 'Are you sure you want to grant admin access to this user?' 
      : 'Are you sure you want to revoke admin access from this user?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      await updateUserPermissions(selectedUserId, {
        filter_type: 'admin',
        admin: enabled
      });
      
      setAdminAccessEnabled(enabled);
      alert(`Admin access ${enabled ? 'granted' : 'revoked'} successfully!`);
    } catch (error) {
      console.error('Failed to update admin access:', error);
      alert(error instanceof Error ? error.message : 'Failed to update admin access');
    } finally {
      setLoading(false);
    }
  };

  const handleManageActivityToggle = async (enabled: boolean) => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    const confirmMessage = enabled 
      ? 'Are you sure you want to activate this user?' 
      : 'Are you sure you want to deactivate this user?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      await toggleUserStatus(selectedUserId, enabled);
      
      setManageActivityEnabled(enabled);
      alert(`User ${enabled ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteLevelUpdate = async (newLevel: string) => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    if (!window.confirm(`Are you sure you want to change invite level to ${newLevel}?`)) {
      return;
    }

    try {
      setLoading(true);
      await updateUserPermissions(selectedUserId, {
        filter_type: 'invite_level',
        invite_level: newLevel as any
      });
      
      setSelectedInviteLevel(newLevel);
      alert('Invite level updated successfully!');
    } catch (error) {
      console.error('Failed to update invite level:', error);
      alert(error instanceof Error ? error.message : 'Failed to update invite level');
    } finally {
      setLoading(false);
    }
  };

  const handleStatsPeopleToggle = async (enabled: boolean) => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    const confirmMessage = enabled 
      ? 'Are you sure you want to grant people stats permission to this user?' 
      : 'Are you sure you want to revoke people stats permission from this user?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setStatsLoading(true);
      console.log('=== handleStatsPeopleToggle Debug ===');
      console.log('Selected User ID:', selectedUserId);
      console.log('People Enabled:', enabled);
      console.log('Selected Stats Content:', selectedStatsContent);
      
      const updateData = {
        filter_type: 'stats',
        stats: {
          people: enabled,
          content: selectedStatsContent
        }
      };
      console.log('Sending update data:', updateData);
      
      const response = await updateUserPermissions(selectedUserId, updateData as any);
      console.log('Update response:', response);
      
      setStatsPeopleEnabled(enabled);
      alert(`People stats permission ${enabled ? 'granted' : 'revoked'} successfully!`);
    } catch (error) {
      console.error('Failed to update people stats permission:', error);
      alert(error instanceof Error ? error.message : 'Failed to update people stats permission');
    } finally {
      setStatsLoading(false);
    }
  };
  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (email: string) => {
    setInviteEmail(email);
    
    if (email.trim() === '') {
      setEmailError('');
      setIsEmailValid(true);
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
    } else {
      setEmailError('');
      setIsEmailValid(true);
    }
  };

  // Handle form submission (Enter key or button click)
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!inviteEmail.trim()) {
      setEmailError('Email address is required');
      setIsEmailValid(false);
      return;
    }
    
    if (!isEmailValid) {
      return;
    }
    
    handleSendInvite();
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setSelectedInviteBrands([]);
    setSelectedDesignation('');
    setEmailError('');
    setIsEmailValid(true);
  };

  // Check current user's admin status
  const currentUserIsAdmin = userData.permissions?.admin || false;
  const hasInvitePermissions = currentUserInviteLevel !== false && currentUserInviteLevel !== 'false';

  return (
    <div className="p-6 bg-white relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Manage users</h1>
        {hasInvitePermissions && (
          <Button 
            variant="primary"
            size="m"
            onClick={() => setShowInviteModal(true)}
            disabled={loading}
          >
            <span className="mr-2">+</span>
            Invite
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Name Dropdown - Show if user is admin OR has invite permissions */}
        {(currentUserIsAdmin || hasInvitePermissions) && (
          <div>
            <div className="w-64">
              <SmartDropdown
                options={userOptions}
                value={selectedUser}
                onChange={handleUserChange}
                placeholder="Select User"
                className="w-full"
                disabled={loading}
                enableSearch={true}
              />
            </div>
          </div>
        )}

        {/* Invite Level Dropdown - Only show for admin users */}
        {currentUserIsAdmin && (
          <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <label className="text-sm font-medium text-gray-700 mr-4">
              Invite Level
            </label>
            <div className="w-48">
              <SmartDropdown
                options={inviteLevelOptions}
                value={selectedInviteLevel}
                onChange={(val) => {
                  const newLevel = val as string;
                  if (newLevel !== selectedInviteLevel) {
                    handleInviteLevelUpdate(newLevel);
                  }
                }}
                placeholder="Select Invite Level"
                className="w-full"
                disabled={loading || !selectedUserId}
              />
            </div>
          </div>
        )}

        {/* Manage Activity Toggle - Show if user is admin OR has invite permissions */}
        {(currentUserIsAdmin || hasInvitePermissions) && (
          <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-700">Deactivate User</span>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium ${
                manageActivityEnabled ? 'text-green-600' : 'text-red-500'
              }`}>
                {manageActivityEnabled ? 'Active' : 'Inactive'}
              </span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={manageActivityEnabled}
                  onChange={(e) => handleManageActivityToggle(e.target.checked)}
                  disabled={loading || !selectedUserId}
                />
                <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                  manageActivityEnabled ? 'bg-gray-800' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    manageActivityEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Admin Access Toggle - Only show for admin users */}
        {currentUserIsAdmin && (
          <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-700">Admin access</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={adminAccessEnabled}
                onChange={(e) => handleAdminAccessToggle(e.target.checked)}
                disabled={loading || !selectedUserId}
              />
              <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                adminAccessEnabled ? 'bg-gray-800' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  adminAccessEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>
        )}

        {/* Stats People Permission Toggle - Only show for admin users */}
        {currentUserIsAdmin && (
          <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-700">Stats People Permission</span>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium ${
                statsPeopleEnabled ? 'text-green-600' : 'text-red-500'
              }`}>
                {statsPeopleEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={statsPeopleEnabled}
                  onChange={(e) => handleStatsPeopleToggle(e.target.checked)}
                  disabled={statsLoading || !selectedUserId}
                />
                <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                  statsPeopleEnabled ? 'bg-gray-800' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    statsPeopleEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        )}

{/* Stats Content Permission - Only show for admin users */}
{currentUserIsAdmin && (
  <div className=" flex justify-between items-center flex-end p-4 bg-gray-100 rounded-md">
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Stats Content Permission</span>
    </div>
      <div >
        <SmartDropdown
          options={statsContentOptions}
          value={selectedStatsContent}
          onChange={async (val) => {
            const values = Array.isArray(val) ? val : [val].filter(Boolean);
            setSelectedStatsContent(values as string[]);
            
            // Auto-update when dropdown changes
            if (selectedUserId) {
              try {
                setStatsLoading(true);
                console.log('=== Auto-updating Stats Content ===');
                console.log('Selected User ID:', selectedUserId);
                console.log('New Content Values:', values);
                console.log('Current People Permission:', statsPeopleEnabled);
                
                const updateData = {
                  filter_type: 'stats',
                  stats: {
                    people: statsPeopleEnabled,
                    content: values as string[]
                  }
                };
                console.log('Auto-update ', updateData);
                
                const response = await updateUserPermissions(selectedUserId, updateData as any);
                console.log('Auto-update response:', response);
              } catch (error) {
                console.error('Failed to auto-update stats content:', error);
                // Revert on error
                setSelectedStatsContent(selectedStatsContent);
                alert(error instanceof Error ? error.message : 'Failed to update stats content');
              } finally {
                setStatsLoading(false);
              }
            }
          }}
          placeholder="Select Stats Content"
          className="w-[250px]"
          disabled={statsLoading || !selectedUserId}
          multiSelector={true}
          enableSearch={false}
        />
      </div>
  </div>
)}

        {/* Message for users with no permissions */}
        {!currentUserIsAdmin && !hasInvitePermissions && (
          <div className="p-6 text-center">
            <div className="text-gray-500 text-sm">
              You don't have sufficient permissions to manage users.
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg border border-gray-300 shadow-lg w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-900 mb-2 pr-8">
                Sign-in invitation
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Enter the email address of the person you want to invite to join.
              </p>

              {/* Brand Selection for Invitation - Only show if user has any_brand invite level */}
              {currentUserInviteLevel === 'any_brand' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand*
                  </label>
                  <SmartDropdowithadd
                    options={inviteBrandOptions}
                    value={selectedInviteBrands.length > 0 ? selectedInviteBrands[0] : ''}
                    onChange={(val) => {
                      const selectedValue = Array.isArray(val) ? val[0] : val;
                      setSelectedInviteBrands(selectedValue ? [selectedValue as string] : []);
                    }}
                    placeholder="Select brand"
                    className="w-full"
                    multiSelector={false}
                    enableAddNew={true}
                    addNewLabel="+ Add New Brand"
                    addNewPlaceholder="Enter new brand name"
                    onAddNew={handleAddNewBrand}
                  />
                </div>
              )}

               {/* Show department info for own_brand users */}
              {currentUserInviteLevel === 'own_brand' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <p className="text-sm text-gray-600">
                    Invites will be sent for: <span className="font-medium">{currentUserData?.depatment || 'Advart'}</span>
                  </p>
                </div>
              )}  

              {/* Designation Selection - Show for all users with invite permissions */}
              {hasInvitePermissions && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <SmartDropdowithadd
                    options={designationOptions}
                    value={selectedDesignation}
                    onChange={(val) => {
                      const selectedValue = Array.isArray(val) ? val[0] : val;
                      setSelectedDesignation(selectedValue as string || '');
                    }}
                    placeholder="Select designation"
                    className="w-full"
                    multiSelector={false}
                    enableAddNew={true}
                    enableSearch={true}
                    addNewLabel="+ Add New Designation"
                    addNewPlaceholder="Enter new designation name"
                    onAddNew={handleAddNewDesignation}
                  />
                </div>
              )}
              

              {/* Email Input */}
              <form onSubmit={handleFormSubmit} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFormSubmit();
                        }
                      }}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                        emailError
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      autoComplete="email"
                      required
                    />
                    {emailError && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {emailError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      !inviteEmail.trim() || 
                      !isEmailValid ||
                      !selectedDesignation.trim() ||
                      inviteLoading ||
                      currentUserInviteLevel === false ||
                      currentUserInviteLevel === 'false' ||
                      (currentUserInviteLevel === 'any_brand' && selectedInviteBrands.length === 0)
                    }
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}