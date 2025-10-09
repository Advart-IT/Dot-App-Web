import React, { useState } from "react";
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2'

type Item = {
    Item_Id: number;
    [key: string]: any;
};

type BrandDomains = {
    [brand: string]: string;
};

const BRAND_DOMAINS: BrandDomains = {
    "prathiksham": "thaiyal.aalam.cloud",
    "beelittle": "beelittle.aalam.cloud",
    "zing": "zing-clothing.aalam.cloud",
    "adoreaboo": "adoreaboo.aalam.cloud",
};

const REQUIRED_FIELDS = [
    "Current_Stock",
    "Alltime_Perday_Quantity",
    "Alltime_Total_Quantity",
    "Days_Sold_Out_Past"
];
const API_BASE =   // CRA
  "https://data.advartit.in";

interface ImageViewProps {
    data: Item[];
    brandName: string;
    selloutThreshold?: number;
}

const IMAGES_PER_PAGE = 50;

export default function ImageView({
    data,
    brandName,
    selloutThreshold = 120,
}: ImageViewProps) {
    const [visibleCount, setVisibleCount] = useState(IMAGES_PER_PAGE);
    const [columns, setColumns] = useState<2 | 3 | 4 | 5 | 6>(6);
    const [colorSort, setColorSort] = useState<string[]>([]); // For color sorting dropdown

    // Get all possible fields except Item_Id
    const allFields = data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== "Item_Id")
        : [];

    // Default: show Item_Name
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    // Get domain for brand, fallback to a default
    const domain = BRAND_DOMAINS[brandName];

    // Build image URL
    function getImageUrl(itemId: number) {
            // brandName is available in this component's scope
            if (brandName === "demo_advart") {
                const base = API_BASE.replace(/\/$/, "");
                // FastAPI endpoint that returns the bytes directly
                return `${base}/api/item-image/${itemId}?business=demo_advart`;
            }

            // Existing brands → CDN/object storage
            const domain = BRAND_DOMAINS[brandName] || "xyasdasdd.com";
            return `https://${domain}/aalam/stock/item/${itemId}/image/_/face_img?size=mdpi`;
            }


    // Helper to get fill and text color based on Days_to_Sellout
    function getFillAndTextColor(item: Item): { bg: string; color: string; colorLabel: 'green' | 'red' | 'orange'; textShadow?: string } {
        const value = Number(item.Days_to_Sellout);
        const currentStock = Number(item.Current_Stock);
        const allTimeTotalQuantity = Number(item.Alltime_Total_Quantity);
        const daysSoldOutPast = item.Days_Sold_Out_Past;
        // orange logic (same as grid):
        if ((daysSoldOutPast !== undefined && currentStock < 0) || ((currentStock <= 0) && (allTimeTotalQuantity > 0))) {
            return { bg: 'rgba(255,140,0,0.85)', color: '#fff', colorLabel: 'orange', textShadow: '0 1px 2px rgba(0,0,0,0.35)' };
        }
        if (isNaN(value)) return { bg: '#e5e7eb', color: '#222', colorLabel: 'green' };
        if (value > selloutThreshold) {
            return { bg: 'rgba(196,3,24,0.8)', color: '#fff', colorLabel: 'red', textShadow: '0 1px 2px rgba(0,0,0,0.35)' };
        } else {
            return { bg: 'rgba(8,96,6,0.8)', color: '#fff', colorLabel: 'green', textShadow: '0 1px 2px rgba(0,0,0,0.35)' };
        }
    }

    // Add state for primary sort
    const [primarySort, setPrimarySort] = useState<string>('grid_order');
    // Define sort options (only grid order and Item ID Desc)
    const primarySortOptions = [
        { label: 'Tabel Order (Default)', value: 'grid_order' },
        { label: 'Item ID (Desc)', value: 'item_id_desc' },
    ];

    // Instead of slicing first, always sort/filter the full data, then slice for visible
    let filteredSortedItems = data
        .map(item => {
            // Determine if required fields are present
            const allFieldsPresent = REQUIRED_FIELDS.every(
                field => item[field] !== undefined && item[field] !== null
            );
            const colorLabel = allFieldsPresent ? getFillAndTextColor(item).colorLabel : "default";
            return { ...item, ...getFillAndTextColor(item), colorLabel, allFieldsPresent };
        });

    // 1. Primary sort
    if (primarySort === 'item_id_desc') {
        filteredSortedItems.sort((a, b) => b.Item_Id - a.Item_Id);
    }
    // 2. Filter by colorSort if any selected
    filteredSortedItems = filteredSortedItems.filter(item => {
        if (colorSort.length === 0) return true;
        return colorSort.includes(item.colorLabel);
    });
    // 3. Secondary sort: order by colorSort selection order, but only as a tie-breaker for primary sort
    if (colorSort.length > 0) {
        const order = colorSort;
        filteredSortedItems.sort((a, b) => {
            let primaryCmp = 0;
            if (primarySort === 'item_id_desc') primaryCmp = b.Item_Id - a.Item_Id;
            if (primaryCmp !== 0) return primaryCmp;
            const aIdx = order.indexOf(a.colorLabel);
            const bIdx = order.indexOf(b.colorLabel);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
    }
    // Only show visibleCount items
    const visibleItems = filteredSortedItems.slice(0, visibleCount);
    const hasMore = visibleItems.length < filteredSortedItems.length;

    // Only show color options that are present in the WHOLE data (not filtered), including "Default" if present
    const allColorsPresent = Array.from(
        new Set(
            data.map(item => {
                const allFieldsPresent = REQUIRED_FIELDS.every(
                    field => item[field] !== undefined && item[field] !== null
                );
                return allFieldsPresent ? getFillAndTextColor(item).colorLabel : "default";
            })
        )
    );
    const colorOptions = allColorsPresent
        .map(color => {
            if (color === 'green') return { label: 'Green - Fast Moving', value: 'green' };
            if (color === 'red') return { label: 'Red - Slow Moving', value: 'red' };
            if (color === 'orange') return { label: 'Orange - Sold Out', value: 'orange' };
            if (color === 'default') return { label: 'Default', value: 'default' };
            return undefined;
        })
        .filter((opt): opt is { label: string; value: string } => !!opt);

    // Auto-load more images when user scrolls near the bottom
    React.useEffect(() => {
        if (visibleCount >= data.length) return;
        function handleScroll() {
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportHeight = window.innerHeight;
            const fullHeight = document.body.scrollHeight;
            // If user is within 200px of the bottom, load more
            if (scrollY + viewportHeight + 200 >= fullHeight) {
                setVisibleCount((c) => Math.min(c + IMAGES_PER_PAGE, filteredSortedItems.length));
            }
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visibleCount, data.length]);

    return (
        <div>
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                <div className="w-[300px]">
                    <label className="text-12 font-normal text-ltxt mb-1">Show fields</label>
                    <SmartDropdown
                        options={allFields.map((f) => ({ label: f, value: f }))}
                        value={selectedFields}
                        onChange={(val) =>
                            setSelectedFields(Array.isArray(val) ? val : [val])
                        }
                        multiSelector
                        placeholder="Select fields"
                        className="w-full"
                        enableSearch

                    />
                </div>
                <div className="w-[100px]">
                    <label className="text-12 font-normal text-ltxt mb-1">Columns</label>
                    <SmartDropdown
                        options={[2, 3, 4, 5, 6].map(n => ({ label: `${n}`, value: `${n}` }))}
                        value={`${columns}`}
                        onChange={val => {
                            const col = Array.isArray(val) ? val[0] : val;
                            setColumns(Number(col) as 2 | 3 | 4 | 5 | 6);
                        }}
                        placeholder="Columns"
                        className="w-full"
                    />
                </div>
                <div className="w-[180px]">
                    <label className="text-12 font-normal text-ltxt mb-1">Sort By</label>
                    <SmartDropdown
                        options={primarySortOptions}
                        value={primarySort}
                        onChange={val => setPrimarySort(val as string)}
                        placeholder="Sort By"
                        className="w-full"

                    />
                </div>

                <div className="w-[220px]">
                    <label className="text-12 font-normal text-ltxt mb-1">Sort By Colors</label>
                    <SmartDropdown
                        options={colorOptions}
                        value={colorSort}
                        onChange={(val) => {
                            // Use the order in which the user selects colors
                            setColorSort(Array.isArray(val) ? val : [val]);
                        }}
                        multiSelector
                        placeholder="Select Colors"
                        className="w-full"
                    />
                </div>
            </div>
            <div
                className={`grid gap-6 wrap-text`}
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
            >
                {visibleItems.map((item) => {
                    // If missing required fields, card will be white bg and black text
                    const { bg, color, textShadow, allFieldsPresent } = item;
                    return (
                        <div
                            key={item.Item_Id}
                            className="flex flex-col items-center rounded-lg p-3 shadow-sm"
                            style={{
                                background: allFieldsPresent ? bg : "#fff",
                                color: allFieldsPresent ? color : "#111",
                                transition: 'background 0.2s, color 0.2s',
                            }}
                        >
                            <img
                                src={getImageUrl(item.Item_Id)}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "contain",
                                    borderRadius: 8,
                                    background: "#f8f8f8",
                                }}
                            />
                            {/* Show selected fields below image */}
                            <div className="mt-2 text-12 space-y-1 w-full wrap-text">
                                {selectedFields.length === 0 ? null : selectedFields.map((field) => (
                                    <div key={field} >
                                        <span className="text-ltxt" style={{ color: allFieldsPresent ? color : "#111", textShadow: allFieldsPresent ? textShadow : undefined }}>
                                            {field}:
                                        </span>
                                        <span style={{ color: allFieldsPresent ? color : "#111", textShadow: allFieldsPresent ? textShadow : undefined, fontWeight: 600, letterSpacing: 0.2 }}>
                                            {String((item as Item)[field] ?? "-")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {hasMore ? (
                <>
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setVisibleCount((c) => Math.min(c + IMAGES_PER_PAGE, filteredSortedItems.length))}
                        >
                            Load More
                        </Button>
                    </div>
                    <div style={{ height: 140 }} /> {/* Spacer to keep button visible */}
                </>
            ) : (
                <div className="flex justify-center mt-6 text-gray-500 text-sm font-medium opacity-80">
                    You're all caught up!
                </div>
            )}

        </div>
    );
}
