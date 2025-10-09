"use client"
import UserProfile from '@/components/profile/UserProfile';
import AdminSection from '@/components/profile/AdminSection';
import { useUser } from '@/hooks/usercontext';

export default function ProfilePage() {
  const { user: userData, isLoading: loading, error } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-themeBase-l1">
        <div className="flex-1 min-h-0 flex flex-col p-x20">
          <div className="p-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex flex-col bg-themeBase-l1">
        <div className="flex-1 min-h-0 flex flex-col p-x20">
          <div className="p-4 text-red-500">{error || 'No user data available'}</div>
        </div>
      </div>
    );
  }

  // Check if user is from Advart department - only Advart users can access profile/settings
  if (userData.depatment !== 'Advart') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">This page could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-themeBase-l1">
      {/* Page Header */}
      
      {/* Content Area */}
      <div className="flex-1 min-h-0 flex flex-col p-x20">
        <AdminSection userData={userData} />
      </div>
    </div>
  );
}