import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageCellRendererProps {
  value: number; // Item_Id
  data: any;
  brandName: string;
  selloutThreshold?: number;
}

const BRAND_DOMAINS: Record<string, string> = {
  prathiksham: "thaiyal.aalam.cloud",
  beelittle: "beelittle.aalam.cloud",
  zing: "zing-clothing.aalam.cloud",
  adoreaboo: "adoreaboo.aalam.cloud",
};

const REQUIRED_FIELDS = [
  "Current_Stock",
  "Alltime_Perday_Quantity",
  "Alltime_Total_Quantity",
  "Days_Sold_Out_Past"
];

// Safe existence check for each required field

// NEW: Local API base for demo_advart
const API_BASE =
  "http://127.0.0.1:9000";

// UPDATED getImageUrl to support demo_advart
function getImageUrl(itemId: number, brandName: string, size: 'ldpi' | 'mdpi' = 'ldpi') {
  if (brandName === "demo_advart") {
    const base = API_BASE.replace(/\/$/, "");
    return `${base}/api/item-image/${itemId}?business=demo_advart`;
  }
  const domain = BRAND_DOMAINS[brandName] || "xyasdasdd.com";
  return `https://${domain}/aalam/stock/item/${itemId}/image/_/face_img?size=${size}`;
}

// Calculate Days_to_Sellout if not present, using the same logic as columnutils


// Calculate Days_to_Sellout using the same logic as columnutils.ts
function getDaysToSellout(item: any): number | undefined {
  const currentStock = Number(item.Current_Stock) || 0;
  const daysSoldOutPast = Number(item.Days_Sold_Out_Past) || 0;
  const launch = Number(item.days_since_launch) || 0;
  const projected = Number(item.Projected_Days_to_Sellout) || 0;

  let daysToSellout = launch + projected;
  if (currentStock <= 0 && daysSoldOutPast > 0) {
    daysToSellout = daysSoldOutPast;
  }
  return isNaN(daysToSellout) ? undefined : daysToSellout;
}

// Color logic as in columnutils.ts
function getColorLabel(item: any, selloutThreshold = 120): "green" | "red" | "gray" {
  const value = getDaysToSellout(item);
  const currentStock = Number(item.Current_Stock);
  const allTimeTotalQuantity = Number(item.Alltime_Total_Quantity);
  const daysSoldOutPast = item.Days_Sold_Out_Past;
  if ((daysSoldOutPast !== undefined && currentStock < 0) || ((currentStock <= 0) && (allTimeTotalQuantity > 0))) {
    return "gray";
  }
  if (typeof value !== "number" || isNaN(value)) return "green";
  if (value > selloutThreshold) {
    return "red";
  }
  return "green";
}


const COLOR_MAP: Record<string, string> = {
  green: "#089606",
  red: "#c40318",
  gray: "#ff8c00", // orange for out of stock
};

const ImageCellRenderer: React.FC<ImageCellRendererProps> = ({ value, data, brandName, selloutThreshold = 120 }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  if (!value) return null;
  const allFieldsPresent =
  !!data &&
  REQUIRED_FIELDS.every(
    field => data[field] !== undefined && data[field] !== null
  );
  const url = getImageUrl(value, brandName, 'ldpi');

  // Get color label for subtle indicator
  const colorLabel = getColorLabel(data, selloutThreshold);
  const indicatorColor = COLOR_MAP[colorLabel];

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    if (rect) {
      setPreviewPos({
        top: rect.top + scrollY,
        left: rect.right + scrollX + 8, // 8px gap
      });
    }
    const timer = setTimeout(() => setShowPreview(true), 750);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setShowPreview(false);
  };

  return (
  <>
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        background: "#ffffff",
        borderRadius: 6,
        minHeight: 28,
        minWidth: 28,
        boxSizing: "border-box",
        padding: 2,
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: allFieldsPresent ? `0 0 0 2px ${indicatorColor}` : undefined,

          transition: "box-shadow 0.2s ease",
        }}
      >
        <img
          ref={imgRef}
          src={url}
          alt={data?.Item_Name || "Item Image"}
          style={{
            width: 24,
            height: 24,
            objectFit: "cover",
            cursor: "pointer",
            display: "block",
            background: "#fff"
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {/* Status indicator dot */}
        {allFieldsPresent && (
        <div
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: indicatorColor,
            border: "1px solid #fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
          }}
        />
      )}

      </div>
    </div>
    {showPreview && createPortal(
      <div
        style={{
          position: "absolute",
          top: previewPos.top,
          left: previewPos.left,
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: 6,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={getImageUrl(value, brandName, 'mdpi')}
          alt={data?.Item_Name || "Item Image"}
          style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, background: "#f8f8f8" }}
        />
      </div>,
      document.body
    )}
  </>
);
};

export default ImageCellRenderer;
