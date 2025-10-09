// components/Sidebar.tsx
import React from 'react';
import { User, Edit, ChartLine, Users } from 'lucide-react';
import type { UserData } from './AdminSection';

interface SidebarProps {
  userData: UserData;
  activeSection: string;
  setActiveSection: (section: string) => void;
  brandAdmin?: boolean;
  reportrixAdmin?: boolean;
}

const Sidebar = React.memo(function Sidebar({ userData, activeSection, setActiveSection, brandAdmin = false, reportrixAdmin = false }: SidebarProps) {
  const allMenuItems = [
    { 
      key: 'Profile', 
      label: 'Profile', 
      icon: User
    },
    { 
      key: 'Content', 
      label: 'Content', 
      icon: Edit,
      requiresBrandAdmin: true
    },
    { 
      key: 'Data', 
      label: 'Data', 
      icon: ChartLine,
      requiresReportrixAdmin: true
    },
    { 
      key: 'Manage', 
      label: 'Manage', 
      icon: Users
    }
  ];

  // Check for specific admin permissions from userData, defaulting to false if not available
  const userBrandAdmin = userData.permissions?.brand_admin || false;
  const userReportrixAdmin = userData.permissions?.reportrix_admin || false;
  const userGeneralAdmin = userData.permissions?.admin || false;
  const userInviteLevel = userData.permissions?.invite_level || false;
  
  // Filter menu items based on specific admin permissions
  const menuItems = allMenuItems.filter(item => {
    // Always show Profile
    if (item.key === 'Profile') return true;
    
    // Show Manage section only if user has admin permissions OR invite_level permissions
    if (item.key === 'Manage') {
      return userGeneralAdmin || (userInviteLevel !== false && userInviteLevel !== 'false');
    }
    
    // Show Content tab only if user has brand_admin permission
    if (item.requiresBrandAdmin && !userBrandAdmin) return false;
    
    // Show Data tab only if user has reportrix_admin permission
    if (item.requiresReportrixAdmin && !userReportrixAdmin) return false;
    
    return true;
  });

  return (
    <div className="w-64 bg-whit border-r border-gray-300 flex flex-col">
      {/* Top Profile Section */}
      {/* <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center mr-3">
            <User className="h-6 w-6 text-gray-800" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{userData.username}</div>
            <div className="text-xs text-gray-500">{userData.designation}</div>
          </div>
        </div>
      </div> */}
      
      {/* Menu Items - With vertical spacing */}
      <div className="py-4">
        <div className="space-y-1">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full text-left px-4 py-3 text-sm font-medium relative flex items-center transition-colors ${
                  activeSection === item.key 
                    ? 'text-gray-900 bg-white border-l-4 border-blue-500' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="h-5 w-5 mr-3" />
                {item.label}
                {activeSection === item.key && item.key !== 'Profile' && (
                  <div className="ml-auto">
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    
    </div>
  );
});

export default Sidebar;