import React, { useEffect, useState } from "react";
import { fetchContent, upsertContent } from "@/lib/content/contentapi"; // Added upsertContent import
import SmartDaySelector from "../custom-ui/dayselectcalendar";
import SmartInput from "../custom-ui/input-box";
import ContentView from "../socialmedia/contentview";
import { Button } from "../custom-ui/button2";

interface PostedViewProps {
    brandName: string;
}

const PostedView: React.FC<PostedViewProps> = ({ brandName }) => {
    const [contentList, setContentList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    useEffect(() => {
        if (!brandName) return;

        let offset = 0;
        const limit = 50;
        let hasMore = true;
        const allContent: any[] = [];

        async function fetchAllContent() {
            setLoading(true);
            try {
                while (hasMore) {
                    const response = await fetchContent({
                        brand_name: brandName,
                        status: "completed",
                        offset,
                        limit,
                    });

                    if (response?.data?.length) {
                        // Filter to include only past dates (before today)
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Set to start of today

                        const pastContent = response.data.filter((item: any) => {
                            if (!item.live_date) return false;
                            const itemDate = new Date(item.live_date);
                            return itemDate <= today; // Changed to <= to include today's date
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
                setContentList(allContent);
            } finally {
                setLoading(false);
            }
        }

        fetchAllContent();
    }, [brandName]);

    const handleMarkAsPosted = async (contentId: number) => {
        try {
            // Actual API call using upsertContent
            const result = await upsertContent({
                id: contentId,
                status: "Posted" // Set status to Posted
            });
            console.log(`Content ${contentId} marked as posted:`, result);

            // Update the UI to reflect the change
            const updatedList = contentList.filter(item => item.id !== contentId);
            setContentList(updatedList);

        } catch (error) {
            console.error("Error marking content as posted:", error);
        }
    };

    const updateContentLiveDate = async (contentId: number, newDate: string) => {
        try {
            // First, check if the new date is today or in the future
            if (newDate) {
                const selectedDate = new Date(newDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // If date is today or future, we'll remove the item from the list after updating
                const isFutureDate = selectedDate > today;

                // Actual API call using upsertContent
                const result = await upsertContent({
                    id: contentId,
                    live_date: newDate
                });
                console.log(`Updated live date for content ${contentId} to ${newDate}:`, result);

                // After successful API call, update UI if it's a future date
                if (isFutureDate) {
                    console.log(`Removing content ID ${contentId} as its date was changed to ${newDate} (future date)`);
                    const filteredList = contentList.filter(item => item.id !== contentId);
                    setContentList(filteredList);
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

        // Check if the item was deleted
        if (updatedRow.is_delete === true) {
            console.log(`Row with ID ${updatedRow.id} removed as it was deleted`);
            // Remove the row from the content list
            const filteredData = contentList.filter((row) => row.id !== updatedRow.id);
            setContentList(filteredData);
            setSelectedRow(null);
            return;
        }

        // Check if the updated row's status changed
        if (typeof updatedRow.status === "string" && updatedRow.status !== "completed") {
            console.log(`Row with ID ${updatedRow.id} removed as its status changed to ${updatedRow.status}`);
            const filteredData = contentList.filter((row) => row.id !== updatedRow.id);
            setContentList(filteredData);
            setSelectedRow(null);
            return;
        }

        // Update the selected row
        setSelectedRow((prevRow: any) => ({
            ...prevRow,
            ...updatedRow,
        }));

        // Update the content list to reflect changes
        const updatedData = contentList.map((row) =>
            row.id === updatedRow.id ? { ...row, ...updatedRow } : row
        );
        setContentList(updatedData);
    };

    return (
        <div className="w-full h-full text-14">
            <h2 className="text-lg font-semibold mb-4">Completed Content</h2>

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