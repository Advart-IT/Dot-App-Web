import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
    icon?: LucideIcon;
    activeClass?: string;
    inactiveClass?: string;
    activeBadgeClass?: string;
    inactiveBadgeClass?: string;
}

interface FilterGroupProps {
    filters: FilterOption[];
    activeFilter: string;
    onFilterChange: (value: string) => void;
    className?: string;
    activeClass?: string;
    inactiveClass?: string;
    defaultActiveBadgeClass?: string;
    defaultInactiveBadgeClass?: string;
}

// FilterGroup Component
export default function FilterGroup({
    filters,
    activeFilter,
    onFilterChange,
    className = '',
    activeClass = 'bg-[#1877f2] text-white shadow-md',
    inactiveClass = 'bg-white text-[#6E6E6E] border border-[#E0E0E0] hover:bg-gray-100',
    defaultActiveBadgeClass = 'bg-[#1877f2] text-white',
    defaultInactiveBadgeClass = 'bg-gray-200 text-gray-800',
}: FilterGroupProps) {
    return (
        <div className={`${className || 'flex gap-2' }`}>
            {filters.map(({ value, label, count, icon: Icon, activeClass: itemActiveClass, inactiveClass: itemInactiveClass, activeBadgeClass, inactiveBadgeClass }) => {
                const isActive = activeFilter === value;

                // Button styles
                const buttonClass = isActive
                    ? itemActiveClass || activeClass
                    : itemInactiveClass || inactiveClass;

                // Badge styles
                const badgeClass = isActive
                    ? activeBadgeClass || defaultActiveBadgeClass
                    : inactiveBadgeClass || defaultInactiveBadgeClass;

                return (
                    <Button
                        key={value}
                        className={`${buttonClass || 'px-4 py-2 rounded-md font-medium transition-all bg-white text-[#6E6E6E] border border-[#E0E0E0] hover:bg-gray-100'}`} onClick={() => onFilterChange(value)}
                    >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {label}
                        {count !== undefined && (
                            <span className={`${badgeClass || 'ml-2 text-xs font-semibold rounded-full px-2 py-0.5 transition-all bg-white text-[#6E6E6E] border border-[#E0E0E0] hover:bg-gray-100'}`}>
                                {count}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div >
    );
}

