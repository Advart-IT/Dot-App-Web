'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/usercontext';
import { 
  getProfilesList, 
  getProfileById, 
  createProfile, 
  updateProfile, 
  deleteProfile,
  type ProfileListItem,
  type ProfileDetailResponse,
  type CreateProfileRequest,
  type UpdateProfileRequest
} from '@/lib/user/user';
import { Button } from '@/components/custom-ui/button2';
import UserComponent from '@/components/user/User';

export default function UserPage() {
  const { user } = useUser();
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileListItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load profiles on component mount
  useEffect(() => {
    if (user?.permissions?.profile) {
      loadProfiles();
    }
  }, [user]);

  // Filter profiles based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = profiles.filter(profile => {
        // Check name
        const nameMatch = profile.name.toLowerCase().includes(term);
        
        // Check tags
        let tagMatch = false;
        if (profile.tag && Array.isArray(profile.tag)) {
          tagMatch = profile.tag.some((tag: string) => 
            tag.toLowerCase().includes(term)
          );
        }
        
        return nameMatch || tagMatch;
      });
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfilesList();
      setProfiles(response.profiles);
      setFilteredProfiles(response.profiles); // Initialize filtered profiles
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileDetails = async (profileId: number) => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getProfileById(profileId);
      setSelectedProfile(profile);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to load profile details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsCreating(true);
    setError(null);
  };

  const handleProfileUpdate = async (profileId: number) => {
    await loadProfileDetails(profileId);
    await loadProfiles(); // Refresh the profiles list
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleProfileDeleted = async () => {
    await loadProfiles(); // Refresh the profiles list
    setSelectedProfile(null); // Reset selected profile to show default state
    setIsCreating(false); // Ensure we're not in create mode
  };

  // Check if user has profile permissions
  if (user && !user.permissions?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-xl text-gray-600 mb-8">Access denied. You don't have permission to view profiles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-themeBase-l1 overflow-hidden">
      {/* Top Bar - Fixed */}
      <div className="bg-themeBase border-b border-themeBase-l2 px-x20 py-x10 flex items-center justify-between flex-shrink-0">
        {/* Left Section: Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">User Profiles</h1>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleCreateProfile}
            variant="primary"
            size="m"
            disabled={loading}
          >
            Create Profile
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex p-x20 overflow-hidden">
        {/* Left Panel - Profiles List */}
        <div className="w-1/3 bg-white border-r border-gray-200 rounded-l-lg flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0 flex-row">
            <h2 className="text-[16px] font-medium text-gray-900">All Profiles ({profiles.length})</h2>
            {/* Search Bar */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 flex-shrink-0">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && profiles.length === 0 && (
            <div className="flex justify-center py-8 flex-shrink-0">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Profiles List */}
          <div className="flex-1 overflow-y-auto">
            {filteredProfiles.length === 0 && !loading ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No profiles match your search' : 'No profiles found'}
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <div
                  key={profile.s_no}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProfile?.profile_id === profile.s_no ? 'bg-gray-100 border-gray-200' : ''
                  }`}
                  onClick={() => {
                    setIsCreating(false);
                    loadProfileDetails(profile.s_no);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center space-x-3">
                        <h3 className="font-medium text-gray-900 truncate">{profile.name}</h3>
                        <div className="flex flex-wrap gap-1">
                          <div>
                          {profile.tag && Array.isArray(profile.tag) && profile.tag.slice(0, 2).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          </div>
                          <div>
                          {profile.tag && Array.isArray(profile.tag) && profile.tag.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{profile.tag.length - 2}
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* {selectedProfile?.profile_id === profile.s_no && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
                    )} */}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Profile Details */}
        <div className="flex-1 bg-white rounded-r-lg relative overflow-hidden">
          {/* Loading Overlay for Right Section */}
          {loading && (selectedProfile || isCreating) && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-r-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading...</span>
              </div>
            </div>
          )}
          
          <div className="h-full overflow-y-auto">
            <UserComponent
              selectedProfile={selectedProfile}
              onProfileUpdate={handleProfileUpdate}
              onError={handleError}
              isCreating={isCreating}
              onProfileCreated={async () => {
                await loadProfiles();
                setIsCreating(false);
              }}
              onProfileDeleted={handleProfileDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}