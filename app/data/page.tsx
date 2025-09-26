'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from "@/components/custom-ui/dropdown2";
import { useUser } from '@/hooks/usercontext';
import { useCollections } from '@/hooks/collections';
import LaunchSummaryFilters from '@/components/data/launchsummary/launchsummary';
import { fetchColumnsAndFields } from '@/lib/data/dataapi'; // Adjust path if needed
import GroupBySummaryFilters from '@/components/data/groupbysummary/groupbysummary';
import DailySaleFilters from '@/components/data/dailysale/dailysale'
import Ga4SummaryFilters from '@/components/data/googleanalytics/ga4summary';
import SEO from '@/components/data/seo/seo';

export default function DataPage() {
    const { user } = useUser();
    const reportrixBrands: string[] = user?.permissions?.reportrix ? Object.keys(user.permissions.reportrix) : [];
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [columnsAndFields, setColumnsAndFields] = useState<any>(null);
    const { setBrand } = useCollections();

    // Memoize allowedTypes and availableTabs for current brand
    const allowedTypes: string[] = useMemo(() => {
        return selectedBrand && user?.permissions?.reportrix && user.permissions.reportrix[selectedBrand]
            ? user.permissions.reportrix[selectedBrand]
            : [];
    }, [selectedBrand, user]);

    const tabMap: { [key: string]: string[] } = {
        Product: ['Launch Summary', 'Daily Sale Report', 'Group By Summary', 'Google Analytics'],
        Seo: ['SEO']
    };
    const availableTabs: string[] = useMemo(() => {
        if (allowedTypes.includes('Product') && allowedTypes.includes('Seo')) {
            return [...tabMap.Product, ...tabMap.Seo];
        } else if (allowedTypes.includes('Product')) {
            return tabMap.Product;
        } else if (allowedTypes.includes('Seo')) {
            return tabMap.Seo;
        }
        return [];
    }, [allowedTypes]);

    const [selectedTab, setSelectedTab] = useState<string>(availableTabs[0] || '');
    useEffect(() => {
        if (availableTabs.length > 0) {
            setSelectedTab(availableTabs[0]);
        }
    }, [availableTabs, selectedBrand]);
    useEffect(() => {
        if (reportrixBrands.length > 0 && !selectedBrand) {
            setSelectedBrand(reportrixBrands[0]);
        }
    }, [reportrixBrands, selectedBrand]);

    // (Removed: selectedTab update on selectedBrand, now handled above)

    // Set brand in collections context and trigger fetch/storage
    useEffect(() => {
        if (selectedBrand) {
            setBrand(selectedBrand);
        }
    }, [selectedBrand, setBrand]);

    useEffect(() => {
        if (selectedBrand) {
            fetchColumnsAndFields(selectedBrand)
                .then((data) => {
                    setColumnsAndFields(data);
                })
                .catch(() => {
                    setColumnsAndFields(null);
                });
        }
    }, [selectedBrand]);

    // Add this check at the top
    if (reportrixBrands.length === 0) {
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

                {/* Right Section: Brand Dropdown */}
                <div className="w-[250px]">
                    {reportrixBrands.length > 0 && (
                        <SmartDropdown
                            options={reportrixBrands.map(b => ({ label: b, value: b }))}
                            value={selectedBrand}
                            onChange={(val) => setSelectedBrand(Array.isArray(val) ? val[0] : val)}
                            placeholder="Select Brand"
                            className="w-full"
                        />
                    )}
                </div>
                
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col p-x20">
                <div className={`${selectedTab === 'Launch Summary' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <LaunchSummaryFilters
                        key={`launch-${selectedBrand}`}
                        brandName={selectedBrand}
                        columnsAndFields={columnsAndFields}
                        containerClass="flex-1 min-h-0 flex flex-col"
                    />
                </div>

                <div className={`${selectedTab === 'Group By Summary' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <GroupBySummaryFilters
                        key={`groupby-${selectedBrand}`}
                        brandName={selectedBrand}
                        columnsAndFields={columnsAndFields}
                        containerClass="flex-1 min-h-0 flex flex-col"
                    />
                </div>

                <div className={`${selectedTab === 'Daily Sale Report' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <DailySaleFilters
                        key={`daily-${selectedBrand}`}
                        brandName={selectedBrand}
                        columnsAndFields={columnsAndFields}
                        containerClass="flex-1 min-h-0 flex flex-col"
                    />
                </div>

                <div className={`${selectedTab === 'Google Analytics' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <Ga4SummaryFilters
                        key={`ga4-${selectedBrand}`}
                        brandName={selectedBrand}
                    />
                </div>

                <div className={`${selectedTab === 'SEO' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col`}>
                    <SEO
                        key={`seo-${selectedBrand}`}
                        brandName={selectedBrand}
                    />
                </div>
            </div>

        </div>
    );
}


