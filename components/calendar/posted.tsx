import React, { useEffect, useState, useRef } from "react";
import { fetchContent, upsertContent } from "@/lib/content/contentapi";
import SmartDaySelector from "../custom-ui/dayselectcalendar";
import SmartInput from "../custom-ui/input-box";
import ContentView from "../socialmedia/contentview";
import { Button } from "../custom-ui/button2";
import SmartDropdown from "../custom-ui/dropdown2";
import { useUser } from "@/hooks/usercontext";

interface PostedViewProps {
    brandName: string;
}

const PostedView: React.FC<PostedViewProps> = ({ brandName }) => {
    const [contentList, setContentList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [selectedFormatType, setSelectedFormatType] = useState<string>("");
    const { user } = useUser();

    // Set default format type to first sorted option when user data loads
    useEffect(() => {
        if (user?.dropdowns?.format_type?.length && !selectedFormatType) {
            const sortedFormatTypes = [...user.dropdowns.format_type].sort((a, b) => a.localeCompare(b));
            setSelectedFormatType(sortedFormatTypes[0]);
        }
    }, [user, selectedFormatType]);

    // Refs to store cached data and loading state
    const cache = useRef<Record<string, any[]>>({}); // Cache for content lists per brand-format combination
    const isLoadingRef = useRef(false); // To prevent concurrent API calls

    // Set default format type to first sorted option when user data loads
    useEffect(() => {
        if (user?.dropdowns?.format_type?.length && !selectedFormatType) {
            const sortedFormatTypes = [...user.dropdowns.format_type].sort((a, b) => a.localeCompare(b));
            setSelectedFormatType(sortedFormatTypes[0]);
        }
    }, [user, selectedFormatType]);

    // Fetch data only when brandName or selectedFormatType changes
    useEffect(() => {
        if (!brandName || !selectedFormatType) return;

        const cacheKey = `${brandName}_${selectedFormatType}`;
        
        // Check if data is already cached
        if (cache.current[cacheKey]) {
            setContentList(cache.current[cacheKey]);
            return;
        }

        // Prevent concurrent API calls
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setLoading(true);

        let offset = 0;
        const limit = 50;
        let hasMore = true;
        const allContent: any[] = [];

        const fetchAllContent = async () => {
            try {
                while (hasMore) {
                    const requestPayload = {
                        brand_name: brandName,
                        status: "completed",
                        offset,
                        limit,
                        format_type: selectedFormatType,
                    };
                    
                    const response = await fetchContent(requestPayload);

                    if (response?.data?.length) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const pastContent = response.data.filter((item: any) => {
                            if (!item.live_date) return false;
                            const itemDate = new Date(item.live_date);
                            return itemDate <= today;
                        });

                        allContent.push(...pastContent);
                    }

                    if (response.pagination && response.pagination.has_more) {
                        offset += limit;
                        hasMore = true;
                    } else {
                        hasMore = false;
                    }
                }
                
                // Cache the fetched data
                cache.current[cacheKey] = allContent;
                setContentList(allContent);
            } finally {
                setLoading(false);
                isLoadingRef.current = false;
            }
        };

        fetchAllContent();
    }, [brandName, selectedFormatType]); // Only re-run when brandName or selectedFormatType changes

    const handleMarkAsPosted = async (contentId: number) => {
        try {
            const result = await upsertContent({
                id: contentId,
                status: "Posted"
            });
            console.log(`Content ${contentId} marked as posted:`, result);

            // Update the UI to reflect the change
            const updatedList = contentList.filter(item => item.id !== contentId);
            setContentList(updatedList);

            // Update cache
            const cacheKey = `${brandName}_${selectedFormatType}`;
            if (cache.current[cacheKey]) {
                cache.current[cacheKey] = updatedList;
            }
        } catch (error) {
            console.error("Error marking content as posted:", error);
        }
    };

    const updateContentLiveDate = async (contentId: number, newDate: string) => {
        try {
            if (newDate) {
                const selectedDate = new Date(newDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isFutureDate = selectedDate > today;

                const result = await upsertContent({
                    id: contentId,
                    live_date: newDate
                });
                console.log(`Updated live date for content ${contentId} to ${newDate}:`, result);

                if (isFutureDate) {
                    console.log(`Removing content ID ${contentId} as its date was changed to ${newDate} (future date)`);
                    const filteredList = contentList.filter(item => item.id !== contentId);
                    setContentList(filteredList);

                    // Update cache
                    const cacheKey = `${brandName}_${selectedFormatType}`;
                    if (cache.current[cacheKey]) {
                        cache.current[cacheKey] = filteredList;
                    }
                }
            }
        } catch (error) {
            console.error("Error updating live date:", error);
        }
    };

    const handleCloseModal = () => {
        console.log("Closing modal...");
        setSelectedRow(null);
    };

    const handleUpdateRow = (updatedRow: any) => {
        console.log("Updated row data from modal:", updatedRow);

        if (updatedRow.is_delete === true) {
            console.log(`Row with ID ${updatedRow.id} removed as it was deleted`);
            const filteredData = contentList.filter((row) => row.id !== updatedRow.id);
            setContentList(filteredData);
            setSelectedRow(null);

            // Update cache
            const cacheKey = `${brandName}_${selectedFormatType}`;
            if (cache.current[cacheKey]) {
                cache.current[cacheKey] = filteredData;
            }
            return;
        }

        if (typeof updatedRow.status === "string" && updatedRow.status !== "completed") {
            console.log(`Row with ID ${updatedRow.id} removed as its status changed to ${updatedRow.status}`);
            const filteredData = contentList.filter((row) => row.id !== updatedRow.id);
            setContentList(filteredData);
            setSelectedRow(null);

            // Update cache
            const cacheKey = `${brandName}_${selectedFormatType}`;
            if (cache.current[cacheKey]) {
                cache.current[cacheKey] = filteredData;
            }
            return;
        }

        setSelectedRow((prevRow: any) => ({
            ...prevRow,
            ...updatedRow,
        }));

        const updatedData = contentList.map((row) =>
            row.id === updatedRow.id ? { ...row, ...updatedRow } : row
        );
        setContentList(updatedData);

        // Update cache
        const cacheKey = `${brandName}_${selectedFormatType}`;
        if (cache.current[cacheKey]) {
            cache.current[cacheKey] = updatedData;
        }
    };

    // Prepare format type options from user data (sorted alphabetically)
    const formatTypeOptions = [
        ...(user?.dropdowns?.format_type?.map(format => ({
            label: format,
            value: format
        })).sort((a, b) => a.label.localeCompare(b.label)) || [])
    ];

    return (
        <div className="w-full h-full text-14">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Completed Content</h2>
                <div className="w-48">
                    <SmartDropdown
                        options={formatTypeOptions}
                        value={selectedFormatType}
                        onChange={(value) => {
                            setSelectedFormatType(value as string);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40 text-gray-600">
                    Loading...
                </div>
            ) : contentList.length > 0 ? (
                <div className="space-y-4 overflow-y-auto">
                    {contentList.map((content, idx) => (
                        <div key={idx} className="border rounded-md p-4">
                            <div className="flex items-end gap-4 w-full">
                                <div className="flex-[3]">
                                    <SmartInput
                                        label="Content Name"
                                        value={content.content_name || ""}
                                        onChange={() => { }}
                                        readOnly
                                    />
                                </div>

                                <div className="flex-[2]">
                                    <SmartInput
                                        label="Task Name"
                                        value={content.task_name || ""}
                                        onChange={() => { }}
                                        readOnly
                                    />
                                </div>

                                <div className="flex-[1] min-w-[120px]">
                                    <SmartDaySelector
                                        buttonClassName="border-none rounded-md px-2 py-2 bg-[#F9FAFB]"
                                        label="Live Date"
                                        value={
                                            content.live_date
                                                ? new Date(content.live_date as string)
                                                : null
                                        }
                                        onChange={(selectedDate: Date | null) => {
                                            const formattedDate = selectedDate
                                                ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
                                                    .toISOString()
                                                    .split("T")[0]
                                                : null;

                                            const updatedList = contentList.map((item, index) => {
                                                if (index === idx) {
                                                    return { ...item, live_date: formattedDate };
                                                }
                                                return item;
                                            });
                                            setContentList(updatedList);

                                            if (formattedDate) {
                                                updateContentLiveDate(content.id, formattedDate);
                                            }
                                        }}
                                        showApplyButton={false}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedRow(content)}
                                        variant="gray"
                                    >
                                        View
                                    </Button>
                                    <Button
                                        onClick={() => handleMarkAsPosted(content.id)}
                                        variant="secondary"
                                    >
                                        Mark as Posted
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <p>No posted content found for this brand.</p>
                </div>
            )}

            {/* Content View Modal */}
            {selectedRow && (
                <ContentView
                    rowData={selectedRow}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdateRow}
                />
            )}
        </div>
    );
};

export default PostedView;