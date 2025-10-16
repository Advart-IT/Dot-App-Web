'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/usercontext';
import { Button } from '@/components/custom-ui/button2';
import People from '@/components/stat/People';
import Content from '@/components/stat/Content';

export default function StatsPage() {
    const { user } = useUser();
    const router = useRouter();

    // Check user permissions and create available tabs
    const availableTabs: string[] = [];
    if (user?.permissions?.Stats?.people) {
        availableTabs.push('People');
    }
    if (user?.permissions?.Stats?.content && user.permissions.Stats.content.length > 0) {
        availableTabs.push('Content');
    }

    const [selectedTab, setSelectedTab] = useState<string>(() => {
        // Set initial tab to the first available tab
        return availableTabs.length > 0 ? availableTabs[0] : '';
    });
<<<<<<< HEAD

=======
>>>>>>> 815faf2ad354129c9dcd7dab3200503e064b52ad
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });
    
    // Cache for storing fetched data to prevent unnecessary API calls
    const [dataCache, setDataCache] = useState<{
        [dateKey: string]: {
            people?: any;
            socialMedia?: any;
            ads?: any;
        }
    }>({});

    // Check if user has Stats permissions, redirect if not
    useEffect(() => {
        if (user && (!user.permissions?.Stats || 
            (!user.permissions.Stats.people && 
             (!user.permissions.Stats.content || user.permissions.Stats.content.length === 0)))) {
            router.push('/dashboard'); // Redirect to dashboard if no stats permissions
            return;
        }
    }, [user, router]);

    // Update selected tab when permissions change
    useEffect(() => {
        if (availableTabs.length > 0 && !availableTabs.includes(selectedTab)) {
            setSelectedTab(availableTabs[0]);
        }
    }, [availableTabs, selectedTab]);

    // Show loading or nothing while checking user status
    if (!user || !user.permissions?.Stats || 
        (!user.permissions.Stats.people && 
         (!user.permissions.Stats.content || user.permissions.Stats.content.length === 0))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-themeBase-l1">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    // If no available tabs, show access denied
    if (availableTabs.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-themeBase-l1">
                <div className="text-center">
                    <p className="text-gray-600">You don't have permission to access stats.</p>
                </div>
            </div>
        );
    }
<<<<<<< HEAD

=======
>>>>>>> 815faf2ad354129c9dcd7dab3200503e064b52ad
    return (
        <div className="min-h-screen flex flex-col bg-themeBase-l1">
            {/* Top Bar */}
            <div className="bg-themeBase border-b border-themeBase-l2 px-x20 py-x10 flex items-center justify-between">

                {/* Left Section: Navigation Buttons */}
                <div className="flex gap-x10">
                    {availableTabs.map(tab => (
                        <Button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            variant='outline'
                            size='m'
                            className={selectedTab === tab ? '!bg-newsecondary !text-themeBase' : ''}
                        >
                            {tab}
                        </Button>
                    ))}
                </div>

                {/* Right Section: Date Input */}
                <div className="flex items-center">
                    <input
                        type="month"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                </div>
                
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col p-x20">
                <div className={`${selectedTab === 'People' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <People 
                        selectedDate={selectedDate} 
                        dataCache={dataCache}
                        setDataCache={setDataCache}
                    />
                </div>

                <div className={`${selectedTab === 'Content' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <Content 
                        selectedDate={selectedDate}
                        dataCache={dataCache}
                        setDataCache={setDataCache}
                        userContentPermissions={user?.permissions?.Stats?.content || []}
                    />
                </div>
            </div>

        </div>
    );
}