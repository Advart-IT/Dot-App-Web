import React, { useState, useEffect } from "react";
import ContentTable from "./contenttable"; // Import the ContentTable component
import ContentView from "./contentview"; // Import the ContentView component
import { fetchContent } from "../../lib/content/contentapi"; // Import the fetchContent function
import SmartDropdown from "../custom-ui/dropdown";
import { useUser } from "@/hooks/usercontext";

interface ContentPageFiltersProps {
    brandName: string;
}

export default function ContentPageFilters({ brandName }: ContentPageFiltersProps) {
    const { user } = useUser();

    // State for selected filters (removed selectedBrand as it comes from props)
    const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [isCreatingContent, setIsCreatingContent] = useState<boolean>(false);

    // State for table data
    const [tableData, setTableData] = useState<any[]>([]);

    // Get available formats for the selected brand
    const getAvailableFormats = (brand: string) => {
        if (!user?.permissions?.brands?.[brand.toLowerCase()]) return [];
        
        const brandPermissions = user.permissions.brands[brand.toLowerCase()];
        const availableFormats: string[] = [];
        
        Object.entries(brandPermissions).forEach(([formatType, permissions]) => {
            // Filter out "Ads" and only include formats with reviewer/creator permissions
            if ((permissions.includes('reviewer') || permissions.includes('creator'))) {
                availableFormats.push(formatType);
            }
        });
        
        return availableFormats;
    };

    // Fetch dropdown options from user data
    const formats = getAvailableFormats(brandName);
    const statuses = user?.dropdowns?.status || [];

    // Set default values when user data is available or brandName changes
    useEffect(() => {
        if (user?.dropdowns && brandName) {
            setSelectedFormat(formats[0] || null);
            setSelectedStatus(statuses[0] || null);
        }
    }, [user, brandName, formats.length, statuses.length]);

    console.log("Brand Name (from props):", brandName);
    console.log("Selected Format:", selectedFormat);
    console.log("Selected Status:", selectedStatus);

    // Handle filter selection
    const handleFormatClick = (format: string) => {
        setSelectedFormat(format);
    };

    const handleStatusClick = (status: string) => {
        setSelectedStatus(status);
    };

    // Fetch data whenever filters change
    useEffect(() => {
        const fetchData = async () => {
            if (brandName && selectedFormat && selectedStatus) {
                try {
                    const data = await fetchContent({
                        brand_name: brandName,
                        status: selectedStatus,
                        format_type: selectedFormat,
                        sort_by: "created_at",
                        sort_order: "desc",
                        offset: 0,
                        limit: 50,
                    });
                    setTableData(data.data);
                    console.log("Fetched data:", data.data);
                } catch (error) {
                    console.error("Error fetching content:", error);
                }
            }
        };

        fetchData();
    }, [brandName, selectedFormat, selectedStatus]);

    // Check if user has access to any formats for this brand
    const hasFormatAccess = formats.length > 0;

    if (!hasFormatAccess) {
        return (
            <div className="p-4 text-center text-red-500">
                <p>You don't have access to any formats for {brandName}. Please contact your admin.</p>
            </div>
        );
    }

    // Function to check if the user has permission to create content
    const hasCreatePermission = (): boolean => {
        if (!brandName || !selectedFormat) return false;

        const brandPermissions = user?.permissions?.brands?.[brandName.toLowerCase()];
        if (!brandPermissions) return false;

        const formatPermissions = brandPermissions[selectedFormat];
        if (!formatPermissions) return false;

        // Check if the user has "reviewer" or "creator" permissions
        return formatPermissions.includes("reviewer") || formatPermissions.includes("creator");
    };

    const isButtonDisabled = !hasCreatePermission();

    return (
        <div className="text-[14px]">
            <div className="flex items-center gap-4" style={{ width: "100%" }}>

                {/* Format Dropdown */}
                <div className="mb-4" style={{ flex: "0 0 200px" }}>
                    <label className="text-[16px] font-semibold mb-2">Format</label>
                    <SmartDropdown
                        options={formats.map((format) => ({ label: format, value: format }))}
                        value={selectedFormat || ""}
                        onChange={(value: string | null) => setSelectedFormat(value || null)}
                        onChangeComplete={(value: string) => handleFormatClick(value)}
                        placeholder="Select a Format"
                    />
                </div>

                {/* Create Content Button */}
                <div className="mb-4 ml-auto">
                    <button
                        onClick={() => setIsCreatingContent(true)}
                        className={`px-4 py-2 rounded-md ${
                            isButtonDisabled
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        disabled={isButtonDisabled}
                    >
                        Create Content
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h2 className="text-[16px] font-semibold mb-2">Status</h2>
                <div className="flex gap-2">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusClick(status)}
                            className={`px-4 py-2 rounded-md ${
                                selectedStatus === status 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-200 text-gray-800"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Table */}
            <ContentTable
                data={tableData}
                format={selectedFormat || ""}
                status={selectedStatus || ""}
            />

            {/* Render ContentView as a Modal */}
            {isCreatingContent && (
                <ContentView
                    rowData={{
                        brand_name: brandName.toLowerCase(),
                        // format_type: selectedFormat || "",
                        status: "Working",
                    }}
                    onClose={() => setIsCreatingContent(false)}
                    onUpdate={(newData) => {
                        console.log("New content created:", newData);

                        // Check if the new data matches the current filters
                        const matchesFilters =
                            newData.brand_name === brandName.toLowerCase() &&
                            newData.format_type === selectedFormat &&
                            newData.status === selectedStatus;

                        if (matchesFilters) {
                            setTableData((prevTableData) => [newData, ...prevTableData]);
                        }

                        setIsCreatingContent(false);
                    }}
                    mode="create"
                />
            )}
        </div>
    );
}