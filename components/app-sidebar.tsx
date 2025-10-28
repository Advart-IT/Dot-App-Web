"use client"
import { useEffect, useState } from "react";
import { hasInfluencerInReview } from "@/lib/Influencer/Influencer";
import { useInfluencerReview } from "@/hooks/influencerReviewContext";
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/usercontext"
import { LogOut, Home, CheckSquare, Menu, X, PanelRight, PanelLeft, Edit, ChartLine, Settings,SquareActivity, UserRound, Clapperboard,Instagram  } from "lucide-react"

interface NavItem {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
}

interface AppSidebarProps {
    isOpen?: boolean
    onToggle?: () => void
    navItems?: NavItem[]
    className?: string
    // optional explicit prop (will be combined with context/api)
    hasInReviewProp?: boolean
}

// Define the API response type
interface InfluencerReviewStatus {
    has_in_review: boolean;
}

export function AppSidebar({ isOpen = true, onToggle, navItems, className = "", hasInReviewProp }: AppSidebarProps) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, logout } = useUser()
    const [hasApiReview, setHasApiReview] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { hasInReviewItems } = useInfluencerReview();

    // Check if user is a reviewer
    const isReviewer = user?.permissions?.influencer?.includes("reviewer");
    
    // Combine both sources of truth: API, context and optional explicit prop
    const hasReview = hasApiReview || hasInReviewItems || !!hasInReviewProp;

    // Extend permissions type for type safety
    type PermissionsFull = {
        shoot?: boolean;
        profile?: boolean;
        Stats?: {
            people?: boolean;
            content?: string[];
        };
    } & typeof user extends { permissions: infer P } ? P : {};
    const permissions = user?.permissions ?? {};
    const handleLogout = () => {
        logout()
    }

    const isDesktopSidebarOpen = isOpen

    // Fetch influencer review status when component mounts and if user is a reviewer
    useEffect(() => {
        const fetchReviewStatus = async () => {
            if (isReviewer) {
                try {
                    setIsLoading(true);
                    const response = await hasInfluencerInReview();
                    // Assuming the API returns a boolean directly based on your API call
                    setHasApiReview(response);
                } catch (error) {
                    console.error("Error fetching review status:", error);
                    setHasApiReview(false);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchReviewStatus();
    }, [isReviewer]);

    const defaultNavItems: NavItem[] = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: Home,
        },
        {
            title: "Tasks",
            url: "/tasks",
            icon: CheckSquare,
        },
        {
            title: "Content",
            url: "/content",
            icon: Edit,
        },
        {
            title: "Data",
            url: "/data",
            icon: ChartLine,
        },
        {
            title: "Influencer",
            url: "/Influencer",
            icon: ({ className }: { className?: string }) => (
                <div className="relative">
                    <Instagram className={className} />
                    {isReviewer && !isLoading && hasReview && (
                        <span className="absolute -top-1 -right-1 block h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white"></span>
                    )}
                </div>
            ),
        },
    ...((permissions as any).shoot ? [{
        title: "Shoot",
        url: "/shoot",
        icon: Clapperboard,
    }] : []),
    ...((permissions as any).profile ? [{
        title: "Profile",
        url: "/user",
        icon: UserRound,
    }] : []),
    ...((permissions as any).Stats && ((permissions as any).Stats.people || ((permissions as any).Stats.content && (permissions as any).Stats.content.length > 0)) ? [{
        title: "Stats",
        url: "/stats",
        icon: SquareActivity ,
    }] : []),
    ]

    const items = navItems || defaultNavItems

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen z-30
          transition-all duration-300 ease-in-out
          border-r border-gray-100
          hidden md:flex md:flex-col
          bg-[#fcfaf8]
          ${isDesktopSidebarOpen ? "w-64" : "w-16"}
          ${className}
        `}
            >
                {/* Sidebar Header */}
                <div
                    className={`
            h-14 flex items-center border-b border-gray-100
            ${isDesktopSidebarOpen ? "justify-between px-3" : "justify-center"}
          `}
                >
                    {isDesktopSidebarOpen && <span className="text-sm font-medium text-gray-800">Dot</span>}
                    <button
                        onClick={onToggle}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {isDesktopSidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3">
                    <ul className="space-y-1">
                        {items.map((item) => {
                            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                            return (
                                <li key={item.title}>
                                    <Link
                                        href={item.url}
                                        className={`
                      flex items-center py-2.5
                      transition-colors duration-200
                      ${isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}
                      ${isDesktopSidebarOpen ? "px-3" : "justify-center px-2"}
                    `}
                                    >
                                        {React.createElement(item.icon, { className: `h-5 w-5 ${isDesktopSidebarOpen ? "mr-3" : ""}` })}
                                        {isDesktopSidebarOpen && <span className="text-sm">{item.title}</span>}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-2 mt-auto border-t border-gray-100">
                    {isDesktopSidebarOpen ? (
                        <div className="space-y-1">
                            {user?.depatment === 'Advart' && (
                                <Link
                                    href="/profile"
                                    className="flex items-center w-full py-1.5 px-2 text-gray-500 hover:text-gray-700 transition-colors rounded-md"
                                >
                                    <Settings className="h-5 w-5 mr-3" />
                                    <span className="text-sm">Settings</span>
                                </Link>
                            )}
                            <div className="flex items-center justify-between w-full py-1.5 px-2 text-gray-500 hover:text-gray-700 transition-colors">
                                <div className="flex items-center space-x-2">
                                    <div className="h-6 w-6 rounded-full bg-[#fcfaf8] flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-600">{user?.username?.charAt(0) || "U"}</span>
                                    </div>
                                    <span className="text-sm">{user?.username || "User"}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="Log out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2">
                            {user?.depatment === 'Advart' && (
                                <Link
                                    href="/profile"
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md"
                                    aria-label="Settings"
                                >
                                    <Settings className="h-5 w-5" />
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Log out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden  top-0 left-0 right-0 h-12 border-b border-gray-100 flex items-center px-3 z-20 relative">
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                </button>
                <span className="absolute left-0 right-0 mx-auto text-center text-sm font-medium text-gray-800 pointer-events-none">
                    Dot
                </span>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`
    md:hidden fixed top-0 left-0 h-screen w-56 z-40
    bg-white border-r border-gray-100
    transform transition-transform duration-200 ease-out
    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
  `}
            >
                <div className="h-12 px-3 flex items-center justify-between border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-800">Dot</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500" aria-label="Close menu">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="px-2 py-3">
                    <ul className="space-y-1">
                        {items.map((item) => {
                            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                            return (
                                <li key={item.title}>
                                    <Link
                                        href={item.url}
                                        className={`
                flex items-center py-2.5 px-2
                transition-colors duration-200
                ${isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}
              `}
                                    >
                                        {React.createElement(item.icon, { className: "h-5 w-5 mr-3" })}
                                        <span className="text-sm">{item.title}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-100 space-y-1">
                    {user?.depatment === 'Advart' && (
                        <Link
                            href="/profile"
                            className="flex items-center w-full py-1.5 px-2 text-gray-500 hover:text-gray-700 transition-colors rounded-md"
                        >
                            <Settings className="h-5 w-5 mr-3" />
                            <span className="text-sm">Settings</span>
                        </Link>
                    )}
                    <div className="flex items-center justify-between w-full py-1.5 px-2 text-gray-500 hover:text-gray-700 transition-colors">
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">{user?.username?.charAt(0) || "U"}</span>
                            </div>
                            <span className="text-sm">{user?.username || "User"}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Log out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Content Padding */}
            <div className="md:hidden h-12" />
        </>
    )
}