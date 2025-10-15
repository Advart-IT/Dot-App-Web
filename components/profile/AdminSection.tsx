// components/AdminSection.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchUserPermissions, UserPermissionsResponse, updateGranularPermissions } from '@/lib/profile/admin'; // Import admin API
import UserProfile from './UserProfile'; // Import the UserProfile component
import ManageSection from './ManageSection'; // Import the ManageSection component
import SmartDropdown from '@/components/custom-ui/dropdown2'; // Import SmartDropdown
import { Button } from '@/components/custom-ui/button2'; // Import custom Button component
import Sidebar from './Sidebar'; // Import the new Sidebar component

// Define the UserData interface here
export interface UserData {
  employee_id: number;
  username: string;
  email: string;
  designation: string;
  depatment?: string; // Note: backend has typo 'depatment' instead of 'department'
  permissions: {
    admin: boolean;
    brands: Record<string, Record<string, string[]>>;
    settings: boolean;
    reportrix: Record<string, string[]>;
    brand_admin?: boolean;
    reportrix_admin?: boolean;
    invite_level?: 'own_brand' | 'any_brand' | false | 'false';
  };
  people: Array<{
    employee_id: number;
    username: string;
  }>;
  dropdowns: {
    designation: any;
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

interface AdminSectionProps {
  userData?: UserData | null;
}

export default function AdminSection({ userData: initialUserData }: AdminSectionProps) {
  const [userData, setUserData] = useState<UserData | null>(initialUserData || null);
  const [selectedUserData, setSelectedUserData] = useState<UserPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(!initialUserData);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('Profile');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null); // Only one brand expanded at a time
  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>({});
  const [dataPermissions, setDataPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [brandAdmin, setBrandAdmin] = useState<boolean>(false);
  const [reportrixAdmin, setReportrixAdmin] = useState<boolean>(false);
  
  // Track original state to detect unsaved changes
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>({});
  const [originalDataPermissions, setOriginalDataPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [originalBrandAdmin, setOriginalBrandAdmin] = useState<boolean>(false);
  const [originalReportrixAdmin, setOriginalReportrixAdmin] = useState<boolean>(false);

  // Memoized computed values to prevent unnecessary calculations
  const userOptions = useMemo(() => {
    return userData?.people.map(person => ({
      label: person.username,
      value: person.username
    })) || [];
  }, [userData?.people]);

  const availableBrands = useMemo(() => {
    return userData?.dropdowns.brand_name || [];
  }, [userData?.dropdowns.brand_name]);

  const availableFormatTypes = useMemo(() => {
    return userData?.dropdowns.format_type || [];
  }, [userData?.dropdowns.format_type]);

  // Memoized handler functions to prevent unnecessary re-renders
  const handleUserChange = useCallback((username: string) => {
    setSelectedUser(username);
    const user = userData?.people?.find(p => p.username === username);
    if (user) {
      setSelectedUserId(user.employee_id);
    }
    // Reset expanded brand when user changes
    setExpandedBrand(null);
  }, [userData?.people]);

  const toggleBrand = useCallback((brand: string) => {
    setExpandedBrand(prev => prev === brand ? null : brand);
  }, []);

  const togglePermission = useCallback((brand: string, formatType: string, role: string) => {
    setPermissions(prev => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [formatType]: {
          ...prev[brand][formatType],
          [role]: !prev[brand][formatType][role]
        }
      }
    }));
  }, []);

  const toggleDataPermission = useCallback((brand: string, permission: string) => {
    setDataPermissions(prev => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [permission]: !prev[brand][permission]
      }
    }));
  }, []);

  // Function to check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Only check for changes if we have a selected user and loaded their data
    if (!selectedUserId || !selectedUserData) return false;
    
    if (activeSection === 'Content') {
      // Check if brand admin status changed
      if (brandAdmin !== originalBrandAdmin) return true;
      
      // Check if any content permissions changed - only if we have original data
      if (Object.keys(originalPermissions).length > 0) {
        return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
      }
    } else if (activeSection === 'Data') {
      // Check if reportrix admin status changed
      if (reportrixAdmin !== originalReportrixAdmin) return true;
      
      // Check if any data permissions changed - only if we have original data
      if (Object.keys(originalDataPermissions).length > 0) {
        return JSON.stringify(dataPermissions) !== JSON.stringify(originalDataPermissions);
      }
    }
    return false;
  }, [activeSection, selectedUserId, selectedUserData, brandAdmin, originalBrandAdmin, reportrixAdmin, originalReportrixAdmin, permissions, originalPermissions, dataPermissions, originalDataPermissions]);

  const handleUpdatePermissions = useCallback(async () => {
    if (!selectedUserId || !selectedUserData || permissionsLoading) return;

    try {
      setPermissionsLoading(true);
      
      if (activeSection === 'Content') {
        // Convert permissions state to backend format - only include brands with permissions
        const brandsData: Record<string, Record<string, string[]>> = {};
        Object.keys(permissions).forEach(brand => {
          const brandFormats: Record<string, string[]> = {};
          let brandHasPermissions = false;
          
          Object.keys(permissions[brand]).forEach(formatType => {
            const roles: string[] = [];
            if (permissions[brand][formatType].Creator) roles.push('creator');
            if (permissions[brand][formatType].Viewer) roles.push('viewer');
            if (permissions[brand][formatType].Reviewer) roles.push('reviewer');
            
            // Only include format types that have at least one permission
            if (roles.length > 0) {
              brandFormats[formatType] = roles;
              brandHasPermissions = true;
            }
          });
          
          // Only include brands that have at least one permission
          if (brandHasPermissions) {
            brandsData[brand] = brandFormats;
          }
        });

        await updateGranularPermissions(selectedUserId, {
          filter_type: 'content',
          brands: brandsData,
          brand_admin: brandAdmin
        });
      } else if (activeSection === 'Data') {
        // Convert data permissions to backend format - only include brands with permissions
        const reportrixData: Record<string, string[]> = {};
        Object.keys(dataPermissions).forEach(brand => {
          const permissionsArray: string[] = [];
          if (dataPermissions[brand].Product) permissionsArray.push('Product');
          if (dataPermissions[brand].SEO) permissionsArray.push('Seo');
          
          // Only include brands that have at least one permission
          if (permissionsArray.length > 0) {
            reportrixData[brand] = permissionsArray;
          }
        });

        await updateGranularPermissions(selectedUserId, {
          filter_type: 'data',
          reportrix: reportrixData,
          reportrix_admin: reportrixAdmin
        });
      }

      // Refresh permissions after update
      const filterType = activeSection.toLowerCase();
      const updatedPermissions = await fetchUserPermissions(selectedUserId, filterType);
      setSelectedUserData(updatedPermissions);
      
      // Update original state to reflect saved changes
      if (activeSection === 'Content') {
        setOriginalPermissions({ ...permissions });
        setOriginalBrandAdmin(brandAdmin);
      } else if (activeSection === 'Data') {
        setOriginalDataPermissions({ ...dataPermissions });
        setOriginalReportrixAdmin(reportrixAdmin);
      }
      
      alert('Permissions updated successfully!');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
      throw error; // Re-throw for handleSectionChange to catch
    } finally {
      setPermissionsLoading(false);
    }
  }, [selectedUserId, selectedUserData, permissionsLoading, activeSection, permissions, dataPermissions, brandAdmin, reportrixAdmin]);

  // Function to handle section switching with confirmation
  const handleSectionChange = useCallback((newSection: string) => {
    // If switching away from Content or Data sections and there are unsaved changes
    if ((activeSection === 'Content' || activeSection === 'Data') && hasUnsavedChanges()) {
      const confirmed = window.confirm(
        'You have unsaved changes. Do you want to update the permissions before switching tabs?\n\nClick "OK" to update and continue, or "Cancel" to discard changes and continue.'
      );
      
      if (confirmed) {
        // User wants to save changes first
        handleUpdatePermissions().then(() => {
          setActiveSection(newSection);
        }).catch(() => {
          // If update fails, ask if they still want to continue
          const forceSwitch = window.confirm('Failed to update permissions. Do you still want to switch tabs and lose your changes?');
          if (forceSwitch) {
            setActiveSection(newSection);
          }
        });
      } else {
        // User wants to discard changes
        setActiveSection(newSection);
      }
    } else {
      // No unsaved changes, switch normally
      setActiveSection(newSection);
    }
  }, [activeSection, hasUnsavedChanges, handleUpdatePermissions]);

  const handleRevokeContentPermissions = useCallback(async () => {
    if (!selectedUserId || permissionsLoading) return;

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to revoke ALL content permissions for this user? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setPermissionsLoading(true);
      
      // Send empty brands object to revoke all content permissions
      const emptyBrandsData: Record<string, Record<string, string[]>> = {};
      
      // Initialize empty structure for all brands and formats
      if (userData) {
        userData.dropdowns.brand_name.forEach((brand: string) => {
          emptyBrandsData[brand] = {};
          userData.dropdowns.format_type.forEach((formatType: string) => {
            emptyBrandsData[brand][formatType] = []; // Empty array = no permissions
          });
        });
      }

      await updateGranularPermissions(selectedUserId, {
        filter_type: 'content',
        brands: emptyBrandsData,
        brand_admin: false // Revoke admin status as well
      });

      // Reset local state to reflect revoked permissions
      const resetPermissions: Record<string, Record<string, Record<string, boolean>>> = {};
      if (userData) {
        userData.dropdowns.brand_name.forEach((brand: string) => {
          resetPermissions[brand] = {};
          userData.dropdowns.format_type.forEach((formatType: string) => {
            resetPermissions[brand][formatType] = {
              Creator: false,
              Viewer: false,
              Reviewer: false,
            };
          });
        });
      }
      setPermissions(resetPermissions);
      setBrandAdmin(false);
      
      alert('All content permissions revoked successfully!');
    } catch (error) {
      console.error('Error revoking content permissions:', error);
      alert('Failed to revoke content permissions. Please try again.');
    } finally {
      setPermissionsLoading(false);
    }
  }, [selectedUserId, permissionsLoading, userData]);

  const handleRevokeDataPermissions = useCallback(async () => {
    if (!selectedUserId || permissionsLoading) return;

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to revoke ALL data permissions for this user? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setPermissionsLoading(true);
      
      // Send empty reportrix object to revoke all data permissions
      const emptyReportrixData: Record<string, string[]> = {};
      
      // Initialize empty structure for all brands
      if (userData) {
        userData.dropdowns.brand_name.forEach((brand: string) => {
          emptyReportrixData[brand] = []; // Empty array = no permissions
        });
      }

      await updateGranularPermissions(selectedUserId, {
        filter_type: 'data',
        reportrix: emptyReportrixData,
        reportrix_admin: false // Revoke admin status as well
      });

      // Reset local state to reflect revoked permissions
      const resetDataPermissions: Record<string, Record<string, boolean>> = {};
      if (userData) {
        userData.dropdowns.brand_name.forEach((brand: string) => {
          resetDataPermissions[brand] = {
            Product: false,
            SEO: false,
          };
        });
      }
      setDataPermissions(resetDataPermissions);
      setReportrixAdmin(false);
      
      alert('All data permissions revoked successfully!');
    } catch (error) {
      console.error('Error revoking data permissions:', error);
      alert('Failed to revoke data permissions. Please try again.');
    } finally {
      setPermissionsLoading(false);
    }
  }, [selectedUserId, permissionsLoading, userData]);

  useEffect(() => {
    let isMounted = true;
    
    // If userData is provided as prop, use it directly
    if (initialUserData) {
      setUserData(initialUserData);
      
      // Set first person as selected if available
      if (initialUserData.people && initialUserData.people.length > 0) {
        setSelectedUser(initialUserData.people[0].username);
        setSelectedUserId(initialUserData.people[0].employee_id);
      }

      // Initialize permissions state with all available brands from dropdowns (for admin users to manage)
      const initialPermissions: Record<string, Record<string, Record<string, boolean>>> = {};
      const availableBrands = initialUserData.dropdowns.brand_name || [];
      const availableFormats = initialUserData.dropdowns.format_type || [];
      
      // Create structure for all available brands and formats
      availableBrands.forEach((brand: string) => {
        initialPermissions[brand] = {};
        availableFormats.forEach((formatType: string) => {
          initialPermissions[brand][formatType] = {
            Creator: false,
            Viewer: false,
            Reviewer: false,
          };
        });
      });
      setPermissions(initialPermissions);

      // Initialize data permissions state with all available brands (for admin users to manage)
      const initialDataPermissions: Record<string, Record<string, boolean>> = {};
      const availableBrandsForData = initialUserData.dropdowns.brand_name || [];
      
      // Create structure for all available brands with Product and SEO permissions
      availableBrandsForData.forEach((brand: string) => {
        initialDataPermissions[brand] = {
          Product: false,
          SEO: false,
        };
      });
      setDataPermissions(initialDataPermissions);

      // Initialize admin permissions from current user's permissions
      const currentUserBrandAdmin = initialUserData.permissions?.brand_admin || false;
      const currentUserReportrixAdmin = initialUserData.permissions?.reportrix_admin || false;
      const currentUserGeneralAdmin = initialUserData.permissions?.admin || false;
      
      setBrandAdmin(currentUserBrandAdmin);
      setReportrixAdmin(currentUserReportrixAdmin);

      // If current activeSection is not allowed, reset to Profile
      if (activeSection === 'Content' && !currentUserBrandAdmin) {
        setActiveSection('Profile');
      } else if (activeSection === 'Data' && !currentUserReportrixAdmin) {
        setActiveSection('Profile');
      }
      // Manage section is always accessible - no permission check needed
      
      setLoading(false);
      return;
    }
    
    // If no userData provided as prop, show error
    if (!isMounted) return;
    setError('No user data provided');
    setLoading(false);
    
    return () => {
      isMounted = false;
    };
  }, [initialUserData, activeSection]); // Include initialUserData to handle prop changes

  // Check if current active section is valid based on specific admin permissions
  useEffect(() => {
    if (userData) {
      console.log('Checking section access - activeSection:', activeSection, 'brandAdmin:', brandAdmin, 'reportrixAdmin:', reportrixAdmin);
      // Use userData permissions directly instead of state variables to avoid timing issues
      const userBrandAdmin = userData.permissions?.brand_admin || false;
      const userReportrixAdmin = userData.permissions?.reportrix_admin || false;
      const userGeneralAdmin = userData.permissions?.admin || false;
      
      // Only redirect if user truly doesn't have permission based on userData
      if (activeSection === 'Content' && !userBrandAdmin) {
        setActiveSection('Profile');
      } else if (activeSection === 'Data' && !userReportrixAdmin) {
        setActiveSection('Profile');
      }
      // Manage section is always accessible - no permission check needed
    }
  }, [activeSection, userData]);

  // Reset selected user when switching between Content and Data sections
  useEffect(() => {
    if (activeSection === 'Content' || activeSection === 'Data') {
      setSelectedUser('');
      setSelectedUserId(null);
      setSelectedUserData(null);
      setExpandedBrand(null);
    }
  }, [activeSection]);

  // Reset original state when user changes (to avoid false positive unsaved changes detection)
  useEffect(() => {
    if (!selectedUserId) {
      setOriginalPermissions({});
      setOriginalDataPermissions({});
      setOriginalBrandAdmin(false);
      setOriginalReportrixAdmin(false);
    }
  }, [selectedUserId]);

  // Load permissions for selected user when user or active section changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadUserPermissions = async () => {
      if (!selectedUserId || activeSection === 'Profile') {
        if (isMounted) {
          setSelectedUserData(null);
        }
        return;
      }

      try {
        if (isMounted) {
          setPermissionsLoading(true);
          setError(null);
        }
        const filterType = activeSection.toLowerCase(); // 'content' or 'data'
        const userPermissions = await fetchUserPermissions(selectedUserId, filterType);
        
        if (!isMounted) return;
        
        setSelectedUserData(userPermissions);

        // Update permissions state from API data
        if (activeSection === 'Content' && userData) {
          const initialPermissions: Record<string, Record<string, Record<string, boolean>>> = {};
          const availableBrands = userData.dropdowns.brand_name || [];
          const availableFormats = userData.dropdowns.format_type || [];
          const userBrands = userPermissions.permissions.brands || {};
          
          // Initialize all brands and formats, then populate with user's actual permissions
          availableBrands.forEach((brand: string) => {
            initialPermissions[brand] = {};
            availableFormats.forEach((formatType: string) => {
              const userPermissionsForBrand = userBrands[brand];
              const userPermissionsForFormat = userPermissionsForBrand ? userBrands[brand][formatType] : [];
              const permissionArray = Array.isArray(userPermissionsForFormat) ? userPermissionsForFormat : [];
              
              initialPermissions[brand][formatType] = {
                Creator: permissionArray.includes('creator'),
                Viewer: permissionArray.includes('viewer'),
                Reviewer: permissionArray.includes('reviewer'),
              };
            });
          });
          setPermissions(initialPermissions);
          setOriginalPermissions(initialPermissions);
          setBrandAdmin(userPermissions.permissions?.brand_admin || false);
          setOriginalBrandAdmin(userPermissions.permissions?.brand_admin || false);
        }

        if (activeSection === 'Data' && userData) {
          const initialDataPermissions: Record<string, Record<string, boolean>> = {};
          const availableBrands = userData.dropdowns.brand_name || [];
          const reportrix = userPermissions.permissions.reportrix || {};
          
          // Initialize all brands, then populate with user's actual permissions
          availableBrands.forEach((brand: string) => {
            let hasProduct = false;
            let hasSEO = false;
            
            // Handle both array format (old) and object format (new)
            if (Array.isArray(reportrix)) {
              hasProduct = reportrix.includes(brand);
              hasSEO = false; // Array format doesn't have SEO info
            } else if (reportrix[brand]) {
              const permissions = Array.isArray(reportrix[brand]) ? reportrix[brand] : [];
              hasProduct = permissions.includes('Product');
              hasSEO = permissions.includes('Seo');
            }
            
            initialDataPermissions[brand] = {
              Product: hasProduct,
              SEO: hasSEO,
            };
          });
          
          setDataPermissions(initialDataPermissions);
          setOriginalDataPermissions(initialDataPermissions);
          setReportrixAdmin(userPermissions.permissions.reportrix_admin || false);
          setOriginalReportrixAdmin(userPermissions.permissions.reportrix_admin || false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading user permissions:', err);
          setError('Failed to load user permissions');
        }
      } finally {
        if (isMounted) {
          setPermissionsLoading(false);
        }
      }
    };

    // Debounce the API call to prevent multiple rapid calls
    timeoutId = setTimeout(() => {
      loadUserPermissions();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedUserId, activeSection, userData]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !userData) {
    return <div className="p-4 text-red-500">{error || 'No user data available'}</div>;
  }

  // Check if user has any admin permissions (brand_admin or reportrix_admin) using userData directly
  const userBrandAdmin = userData.permissions?.brand_admin || false;
  const userReportrixAdmin = userData.permissions?.reportrix_admin || false;
  // Always show the admin interface with sidebar since Manage should be available by default
  // Individual sections will be filtered based on specific permissions in the sidebar

  const renderContent = () => {
    // Note: Access validation is handled in useEffect, not here to avoid redirect loops

    switch (activeSection) {
      case 'Profile':
        return <UserProfile userData={userData} />;

      case 'Content':
        return (
          <div className="p-6 bg-white h-full flex flex-col">
            {/* Header with Name dropdown and Revoke button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="min-w-[150px]">
                  <SmartDropdown
                    options={userOptions}
                    value={selectedUser}
                    onChange={(val) => handleUserChange(val as string)}
                    placeholder="Select User"
                    className='w-[210px]'
                    disabled={permissionsLoading}
                    enableSearch={true}
                  />
                </div>
                {permissionsLoading && (
                  <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                )}
              </div>
              {selectedUser && (
                <div className="flex gap-3">
                  <Button 
                    onClick={handleRevokeContentPermissions}
                    disabled={permissionsLoading || !selectedUserId}
                    variant="outline" 
                    size="m"
                  >
                    Revoke
                  </Button>
                  <Button 
                    onClick={handleUpdatePermissions}
                    disabled={permissionsLoading || !selectedUserId}
                    variant="primary"
                    size="m"
                  >{permissionsLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              )}
            </div>

            {/* Show content only when user is selected */}
            {selectedUser ? (
              <>
                {permissionsLoading ? ( // Hide toggle and table, show loading message when data is fetching
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                      <span className="text-sm">Loading user permissions...</span>
                    </div>
                  </div>
                ) : selectedUserData ? ( // Show toggle and table together when data is loaded
                  <>
                    {/* Brand Admin Toggle - Only visible to admin users */}
                    {userData.permissions?.admin && (
                      <div className="flex justify-between items-center mb-4 p-3 bg-gray-300 rounded-lg border">
                        <label className="text-sm font-medium text-gray-700 mr-4">Brand Admin</label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={brandAdmin}
                            onChange={(e) => setBrandAdmin(e.target.checked)}
                            disabled={permissionsLoading}
                          />
                          <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                            brandAdmin ? 'bg-gray-800' : 'bg-gray-100'
                          } ${permissionsLoading ? 'opacity-50' : ''}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              brandAdmin ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Brand Sections - Scrollable container */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {availableBrands.map(brand => (
                        <div key={brand} className="border border-gray-300 rounded-lg">
                          <div 
                            className={`flex justify-between items-center p-4 bg-gray-200 cursor-pointer hover:bg-gray-250 transition-colors ${
                              expandedBrand === brand 
                                ? 'rounded-t-lg' 
                                : 'rounded-lg'
                            }`}
                            onClick={() => toggleBrand(brand)}
                          >
                            <span className="text-sm font-medium text-gray-700">{brand}</span>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 transition-transform ${expandedBrand === brand ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          
                          {expandedBrand === brand && (
                            <div className="border-t border-gray-300 rounded-b-lg overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                      Permissions
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                      Creator
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                      Viewer
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                      Reviewer
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {availableFormatTypes.map(formatType => (
                                    <tr key={formatType}>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {formatType}
                                      </td>
                                      {['Creator', 'Viewer', 'Reviewer'].map(role => (
                                        <td key={role} className="px-4 py-3 text-center">
                                          <label className="inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              className="sr-only"
                                              checked={permissions[brand]?.[formatType]?.[role] || false}
                                              onChange={() => togglePermission(brand, formatType, role)}
                                            />
                                            <div className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                                              permissions[brand]?.[formatType]?.[role] 
                                                ? 'bg-black' 
                                                : 'bg-gray-300'
                                            }`}>
                                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                permissions[brand]?.[formatType]?.[role] 
                                                  ? 'translate-x-4' 
                                                  : 'translate-x-0'
                                              }`}></div>
                                            </div>
                                          </label>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                      </div>
                    </div>
                  </>
                ) : null} {/* Don't show anything when no user selected and not loading */}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Please select a user to manage content permissions</div>
              </div>
            )}

          </div>
        );

      case 'Data':
        return (
          <div className="p-6 bg-white h-full flex flex-col">
            {/* Header with Name dropdown and Revoke button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="min-w-[150px]">
                  <SmartDropdown
                    options={userOptions}
                    value={selectedUser}
                    onChange={(val) => handleUserChange(val as string)}
                    placeholder="Select User"
                    className='w-[210px]'
                    disabled={permissionsLoading}
                    enableSearch={true}
                  />
                </div>
                {permissionsLoading && (
                  <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                )}
              </div>
              {selectedUser && (
                <div className="flex gap-3">
                  <Button 
                    onClick={handleRevokeDataPermissions}
                    disabled={permissionsLoading || !selectedUserId}
                    variant="outline" 
                    size="m"
                  >
                    Revoke
                  </Button>
                  <Button 
                    onClick={handleUpdatePermissions}
                    disabled={permissionsLoading || !selectedUserId}
                    variant="primary"
                    size="m"
                  >{permissionsLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              )}
            </div>

            {/* Show content only when user is selected */}
            {selectedUser ? (
              <>
                {permissionsLoading ? ( // Hide toggle and table, show loading message when data is fetching
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                      <span className="text-sm">Loading user permissions...</span>
                    </div>
                  </div>
                ) : selectedUserData ? ( // Show toggle and table together when data is loaded
                  <>
                    {/* Reportrix Admin Toggle - Only visible to admin users */}
                    {userData.permissions?.admin && (
                      <div className="flex justify-between items-center mb-4 p-3 bg-gray-300 rounded-lg border">
                        <label className="text-sm font-medium text-gray-700">Reportrix Admin</label>
                        <div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                          type="checkbox"
                          className="sr-only"
                          checked={reportrixAdmin}
                          onChange={(e) => setReportrixAdmin(e.target.checked)}
                          disabled={permissionsLoading}
                          />
                          <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                          reportrixAdmin ? 'bg-gray-800' : 'bg-gray-100'
                          } ${permissionsLoading ? 'opacity-50' : ''}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            reportrixAdmin ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                          </div>
                        </label>
                        </div>
                      </div>
                    )}

                    {/* Data Permissions Table - Scrollable container */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Brand                            </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                Product
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                                SEO
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {availableBrands.map(brand => (
                            <tr key={brand} className="bg-white">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {brand}
                              </td>
                              {['Product', 'SEO'].map(permission => (
                                <td key={permission} className="px-4 py-3 text-center">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={dataPermissions[brand]?.[permission] || false}
                                      onChange={() => toggleDataPermission(brand, permission)}
                                    />
                                    <div className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                                      dataPermissions[brand]?.[permission] 
                                        ? 'bg-black' 
                                        : 'bg-gray-300'
                                    }`}>
                                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        dataPermissions[brand]?.[permission] 
                                          ? 'translate-x-4' 
                                          : 'translate-x-0'
                                      }`}></div>
                                    </div>
                                  </label>
                                </td>
                              ))}
                            </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null} {/* Don't show anything when no user selected and not loading */}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Please select a user to manage data permissions</div>
              </div>
            )}

          </div>
        );

      case 'Manage':
        // Manage section is always accessible
        return <ManageSection userData={userData} />;

      default:
        return <UserProfile userData={userData} />;
    }
  };

  return (
    <div className="flex h-screen bg-white rounded-md border border-gray-200 overflow-hidden">
      <Sidebar 
        userData={userData} 
        activeSection={activeSection} 
        setActiveSection={handleSectionChange}
        brandAdmin={brandAdmin}
        reportrixAdmin={reportrixAdmin}
      />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}