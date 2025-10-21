"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { fetchUserData, logoutUser } from "@/lib/auth-api" // Import API functions
import { useRouter } from "next/navigation"; // Add this import

// Define the shape of the user data
interface User {
  employee_id: number;
  username: string;
  email: string;
  designation: string;
  depatment?: string; // Note: backend has typo 'depatment' instead of 'department'
  permissions: {
    admin: boolean;
    brands: {
      [brandName: string]: {
        [formatType: string]: Array<"reviewer" | "creator" | "viewer">;
      };
    };
    settings: boolean;
    reportrix: {
      [brand: string]: string[];
    };
    brand_admin?: boolean;
    reportrix_admin?: boolean;
    invite_level?: 'own_brand' | 'any_brand';
    profile?: boolean;
    Stats?: {
      people?: boolean;
      content?: string[];
    };
  };
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
    tags: string[];
    contact?: string[];
  designation?: string[];
  category?: any;
  photographers?: string[];
  shoot_chargers?: string[];
  expenses?: string[];
  };
}

// Define the shape of the context
interface UserContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  refreshUserData: () => Promise<void>
  logout: () => Promise<void>
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const userData = await fetchUserData() // Fetch user data from API
        setUser(userData) // Store user data in state
      } catch (err) {
        console.error("Failed to fetch user data:", err)
        setError("Failed to fetch user data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      setIsLoading(true)
      const userData = await fetchUserData() // Fetch user data from API
      setUser(userData) // Update user data in state
    } catch (err) {
      console.error("Failed to refresh user data:", err)
      setError("Failed to refresh user data")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle logout
  const logout = async () => {
    try {
      await logoutUser() // Trigger the logout API
      setUser(null) // Clear user data from state
      localStorage.removeItem("user") // Optional: Clear localStorage if used
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout failed:", err)
      throw new Error("Logout failed")
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUserData, logout }}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}