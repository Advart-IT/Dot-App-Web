'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from "@/components/custom-ui/dropdown2";
import { useUser } from '@/hooks/usercontext';
import ContentCalendar from '@/components/calendar/content';
import ContentPageFilters from "@/components/socialmedia/contentpagefilters";
import PostedModal from "@/components/calendar/posted"; // Add this import at the top


export default function MyPage() {
  const [selectedTab, setSelectedTab] = useState<'Table' | 'Calendar' | 'Mark as Posted'>('Table');
  const { user } = useUser();
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [contentBrands, setContentBrands] = useState<string[]>([]);

  // Using a separate effect to extract brand names since user.permissions.brands is an object and not an array like reportrixBrands
  useEffect(() => {
    if (user?.permissions?.brands) {
      const brandNames = Object.keys(user.permissions.brands);
      setContentBrands(brandNames);
    }
  }, [user?.permissions?.brands]);

  // Then your original effect becomes:
  useEffect(() => {
    if (contentBrands.length > 0) {
      setSelectedBrand(contentBrands[0]);
    }
  }, [contentBrands]);


  // Add this check at the top
  if (contentBrands.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>You don't have access to any brands. Please contact your admin.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-themeBase-l1">
      {/* Top Bar */}
      <div className="bg-themeBase border-b border-themeBase-l2 px-x20 py-x10 flex items-center justify-between">
        {/* Left Section: Navigation Buttons */}
        <div className="flex gap-x10">
          <Button
            onClick={() => setSelectedTab('Table')}
            variant='outline'
            size='m'
            className={`${selectedTab === 'Table'
              ? '!bg-newsecondary !text-themeBase'
              : ''
              }`}
          >
            Table
          </Button>
          <Button
            onClick={() => setSelectedTab('Calendar')}
            variant='outline'
            size='m'
            className={`${selectedTab === 'Calendar'
              ? '!bg-newsecondary !text-themeBase'
              : ''
              }`}
          >
            Calendar
          </Button>
          {/* Mark as Posted Button */}
          {selectedBrand && (
            <Button
              onClick={() => setSelectedTab('Mark as Posted')}
              variant="outline"
              size="m"
              className={`${selectedTab === 'Mark as Posted'
                ? '!bg-newsecondary !text-themeBase'
                : ''
                }`}
            >
              Mark as Posted
            </Button>
          )}
        </div>

        {/* Right Section: Brand Dropdown */}
        <div className="w-[250px]">
          {contentBrands.length > 0 && (
            <SmartDropdown
              options={contentBrands.map(b => ({ label: b, value: b }))}
              value={selectedBrand}
              onChange={(val) => setSelectedBrand(Array.isArray(val) ? val[0] : val)}
              placeholder="Select Brand"
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* PostedModal */}



      {/* Content Area */}
      <div className="flex-1 min-h-0 flex flex-col p-x20">
        <div className="bg-white rounded-xl shadow flex-1 flex flex-col p-x20">
          {selectedTab === 'Table' && (
            <ContentPageFilters brandName={selectedBrand} />
          )}
          {selectedTab === 'Calendar' && (
            <ContentCalendar brandName={selectedBrand} />
          )}
          {selectedTab === 'Mark as Posted' && (
            <PostedModal brandName={selectedBrand} />
          )}
        </div>
      </div>
    </div>
  );
}
