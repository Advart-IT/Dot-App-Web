// Export baseColumns
export const baseColumns = [
    { id: "id", label: "ID", accessor: "id", width: "100px" },
    { id: "created_by_name", label: "Created By", accessor: "created_by_name", width: "150px" },
    { id: "created_at", label: "Created At", accessor: "created_at", width: "200px" },
    { id: "updated_at", label: "Updated At", accessor: "updated_at", width: "200px" },
    { id: "brand_name", label: "Brand Name", accessor: "brand_name", width: "150px" },
    { id: "content_name", label: "Content Name", accessor: "content_name", width: "250px" },
    { id: "status", label: "Status", accessor: "status", width: "150px" },
    { id: "format_type", label: "Format Type", accessor: "format_type", width: "150px" },
    { id: "is_delete", label: "Delete", accessor: "is_delete", width: "100px" },
];

// Export contentColumns
export const contentColumns = [
    { id: "detailed_concept", label: "Detailed Concept", accessor: "detailed_concept", width: "250px" },
    { id: "copy", label: "Copy", accessor: "copy", width: "200px" },
    { id: "reference", label: "Reference", accessor: "reference", width: "150px" },
    { id: "media_links", label: "Media Links", accessor: "media_links", width: "200px" },
    { id: "live_date", label: "Live Date", accessor: "live_date", width: "150px" },
];

// Define getColumns function
export const getColumns2 = (format: string, status: string) => {
    console.log(" getcolumns2 called with format:", format, "and status:", status);
    const commonformatColumns = [
        { id: "marketing_funnel", label: "Funnel", accessor: "marketing_funnel", width: "150px" },
        { id: "top_pointers", label: "Top Pointers", accessor: "top_pointers", width: "200px" },
        { id: "post_type", label: "Post Type", accessor: "post_type", width: "150px" },
        { id: "ads_type", label: "Ads Type", accessor: "ads_type", width: "150px" },
        { id: "description", label: "Description", accessor: "description", width: "250px" },
        { id: "hashtags", label: "Hashtags", accessor: "hashtags", width: "150px" },
        { id: "seo_keywords", label: "SEO Keywords", accessor: "seo_keywords", width: "200px" },
    ];

    const taskSpecificColumns = [
        { id: "task_id", label: "Task ID", accessor: "task_id", width: "150px" },
        { id: "task_name", label: "Task Name", accessor: "task_name", width: "200px" },
        { id: "task_status", label: "Task Status", accessor: "task_status", width: "150px" },
        { id: "assigned_to_name", label: "Assigned To", accessor: "assigned_to_name", width: "150px" },
        { id: "due_date", label: "Due Date", accessor: "due_date", width: "150px" },
    ];

    const reviewSpecificColumns = [
        { id: "review_comment", label: "Review Comment", accessor: "review_comment", width: "250px" },
        { id: "review_comment_log", label: "Review Comment Log", accessor: "review_comment_log", width: "250px" },
    ];

    const formatSpecificColumns = (() => {
        if (format === "Story") {
            return commonformatColumns.filter((col) =>
                ["marketing_funnel", "top_pointers", "post_type"].includes(col.accessor)
            );
        } else if (format === "Post") {
            return commonformatColumns.filter((col) =>
                ["marketing_funnel", "top_pointers", "post_type", "description", "hashtags", "seo_keywords"].includes(
                    col.accessor
                )
            );
        } else if (format === "Reels") {
            return commonformatColumns.filter((col) =>
                ["marketing_funnel", "top_pointers", "description", "hashtags", "seo_keywords"].includes(col.accessor)
            );
        } else if (format === "Ads") {
            return [
                ...commonformatColumns.filter((col) => ["ads_type"].includes(col.accessor)),
                { id: "category", label: "Category", accessor: "category", width: "150px" }
            ];
        }
        return [];
    })();

    const statusSpecificReviewColumns = (() => {
        if (status.toLowerCase() !== "working") {
            return reviewSpecificColumns;
        }
        return [];
    })();

    const statusSpecificTaskColumns = (() => {
        if (status === "Approved") {
            return taskSpecificColumns.filter((col) => ["task_name"].includes(col.accessor));
        } else if (status === "Tasks" || status === "Completed" || status === "Posted") {
            return [
                { id: "task_id", label: "Task ID", accessor: "task_id", width: "150px" },
                { id: "task_name", label: "Task Name", accessor: "task_name", width: "200px" },
                { id: "task_status", label: "Task Status", accessor: "task_status", width: "150px" },
                { id: "assigned_to_name", label: "Assigned To", accessor: "assigned_to_name", width: "150px" },
                { id: "due_date", label: "Due Date", accessor: "due_date", width: "150px" },
            ];
        }
        return [];
    })();

    return [
        ...formatSpecificColumns,
        ...statusSpecificReviewColumns,
        ...statusSpecificTaskColumns,
    ];
};

