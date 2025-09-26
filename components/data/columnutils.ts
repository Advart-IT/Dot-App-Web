import type { ColDef } from "ag-grid-community";
import ImageCellRenderer from "./ImageCellRenderer";

export type RowData = {
  [key: string]: string | number | boolean | null | undefined | object;
};

export type StockAnalysis = {
  redCount: number;
  greenCount: number;
  redStockSum: number;
  greenStockSum: number;
  redProjectedQtySum: number;
  greenProjectedQtySum: number;
  redExpectedQtySum: number;
  greenExpectedQtySum: number;
  redTotalViews: number;
  greenTotalViews: number;
  redTotalAddedToCart: number;
  greenTotalAddedToCart: number;
  redTotalStock: number;
  greenTotalStock: number;
  redAlltimeTotalQuantity: number;
  greenAlltimeTotalQuantity: number;
};



const scsRgb: [number, number, number] = [8, 96, 6];
const dngRgb: [number, number, number] = [196, 3, 24];

const rgb = (tuple: [number, number, number]) => `rgb(${tuple.join(",")})`;

const isProbablyNumber = (key: string, sample: unknown) => {
  const lowerKey = key.toLowerCase();
  const numberKeywords = [
    "total", "quantity", "qty", "stock", "count", "days", "id",
    "price", "rate", "percent", "percentage", "deviation", "amount", "score", "value", "number"
  ];
  return typeof sample === "number" && !isNaN(sample)
    || numberKeywords.some((word) => lowerKey.includes(word));
};

const isSizeByObject = (key: string, sample: unknown) =>
  sample !== null &&
  typeof sample === "object" &&
  !Array.isArray(sample) &&
  (key === "Stock_By_Size" || key === "Sales_By_Size" || key === "Sales_By_Age" || key === "Stock_By_Age");

const isProbablyBoolean = (key: string, sample: unknown) =>
  typeof sample === "boolean" || key.toLowerCase().startsWith("is");

const isProbablyDate = (key: string, sample: unknown) =>
  typeof sample === "string" && key.toLowerCase().includes("date");

const isMainDateColumn = (key: string) =>
  key.toLowerCase() === "date";

const numberFormatter = (value: number): string =>
  value?.toLocaleString("en-IN");

const currencyFormatter = (value: number): string =>
  `₹${value?.toLocaleString("en-IN")}`;

const percentageCellStyle = (value: number): Record<string, string> => ({
  color: value >= 0 ? "green" : "red",
  fontWeight: "600",
});

const formatPercentageValue = (value: number): string => {
  const arrow = value >= 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(value)}%`;
};
const round2 = (val: number): number => Math.round(val * 100) / 100;

const currencyCellStyle = (): Record<string, string> => ({
  color: "#000",
});

// ✅ Updated
export const calculateStockAnalysis = (
  data: RowData[],
  selloutThreshold = 120,
  projectedQtyThreshold = 120
): StockAnalysis => {
  let redCount = 0;
  let greenCount = 0;
  let redStockSum = 0;
  let greenStockSum = 0;
  let redProjectedQtySum = 0;
  let greenProjectedQtySum = 0;
  let redExpectedQtySum = 0;
  let greenExpectedQtySum = 0;

  let redTotalViews = 0;
  let greenTotalViews = 0;
  let redTotalAddedToCart = 0;
  let greenTotalAddedToCart = 0;
  let redTotalStock = 0;
  let greenTotalStock = 0;
  let redAlltimeTotalQuantity = 0;
  let greenAlltimeTotalQuantity = 0;

  data.forEach((row) => {
    if (
      row.days_since_launch === undefined ||
      row.Projected_Days_to_Sellout === undefined ||
      row.Alltime_Perday_Quantity === undefined ||
      row.Current_Stock === undefined ||
      row.Alltime_Items_Viewed === undefined ||
      row.Alltime_Items_ATC === undefined ||
      row.Alltime_Total_Quantity === undefined
    ) {
      return;
    }

    const launch = Number(row.days_since_launch);
    const projected = Number(row.Projected_Days_to_Sellout);
    const perDayQty = Number(row.Alltime_Perday_Quantity);
    const currentStock = Number(row.Current_Stock);
    const totalViews = Number(row.Alltime_Items_Viewed);
    const addedToCart = Number(row.Alltime_Items_ATC);
    const alltimeTotalQuantity = Number(row.Alltime_Total_Quantity);
    const totalstock = Number(row.Total_Stock);
    const daysSoldOutPast = Number(row.Days_Sold_Out_Past);

    if (
      isNaN(launch) ||
      isNaN(projected) ||
      isNaN(perDayQty) ||
      isNaN(currentStock) ||
      isNaN(totalViews) ||
      isNaN(addedToCart) ||
      isNaN(alltimeTotalQuantity)
    ) {
      return;
    }

    // 🔥 NEW LOGIC: use Days_Sold_Out_Past if stock <= 0 and it exists
    let daysToSellout = launch + projected;
    if (currentStock <= 0 && !isNaN(daysSoldOutPast) && daysSoldOutPast > 0) {
      daysToSellout = daysSoldOutPast;
    }

    const projectedQty = perDayQty * projectedQtyThreshold;
    const expectedSales = Math.min(projectedQty, currentStock);
    const isDanger = daysToSellout > selloutThreshold;

    if (isDanger) {
      redCount++;
      redStockSum += currentStock;
      redProjectedQtySum += projectedQty;
      redExpectedQtySum += expectedSales;
      redTotalViews += totalViews;
      redTotalAddedToCart += addedToCart;
      redTotalStock += totalstock;
      redAlltimeTotalQuantity += alltimeTotalQuantity;
    } else {
      greenCount++;
      greenStockSum += currentStock;
      greenProjectedQtySum += projectedQty;
      greenExpectedQtySum += expectedSales;
      greenTotalViews += totalViews;
      greenTotalAddedToCart += addedToCart;
      greenTotalStock += totalstock;
      greenAlltimeTotalQuantity += alltimeTotalQuantity;
    }
  });

  return {
    redCount,
    greenCount,
    redStockSum,
    greenStockSum,
    redProjectedQtySum,
    greenProjectedQtySum,
    redExpectedQtySum,
    greenExpectedQtySum,
    redTotalViews,
    greenTotalViews,
    redTotalAddedToCart,
    greenTotalAddedToCart,
    redTotalStock,
    greenTotalStock,
    redAlltimeTotalQuantity,
    greenAlltimeTotalQuantity,
  };
};


export const generateColumnDefs = (
  data: RowData[],
  selloutThreshold = 120,
  onClickCell?: (params: { type: string; value: any }) => void,
  projectedQtyThreshold = 500
): ColDef<RowData>[] => {
  if (!data || data.length === 0) return [];

  const sample = data[0];
  const fields = Object.keys(sample);
  const hasDaysFields = "days_since_launch" in sample && "Projected_Days_to_Sellout" in sample;
  const hasPerDayQty = "Alltime_Perday_Quantity" in sample;

  const columns: ColDef<RowData>[] = fields.map((key) => {
    const sampleValue = sample[key];
    const field = key.trim();
    const lower = field.toLowerCase();

    if (field === "launch_date") {
        return {
          field,
          filter: "agTextColumnFilter",  // Not a date filter!
          sortable: true,
          resizable: true,
          valueFormatter: (params) => params.value,
        };
      }

    if (isSizeByObject(field, sampleValue)) {
      return {
        field,
        valueFormatter: () => "View Sizes",
        cellStyle: {
          cursor: "pointer",
          color: "#007bff",
          textDecoration: "underline",
        },
        resizable: true,
        sortable: false,
        filter: false,
        onCellClicked: onClickCell
          ? (params) => {
              const raw = params.value;
              const value =
                raw && typeof raw === "object"
                  ? Object.entries(raw).map(([size, val]: any) => ({
                      Size: size,
                      Quantity: val?.Quantity ?? 0,
                      Item_Name_Count: val?.Item_Name_Count ?? val?.Item_Count ?? 0,
                    }))
                  : [];
              onClickCell({ type: field, value });
            }
          : undefined,
      };
    }
if (field === "Days_Sold_Out_Past") {
  return {
    field,
    filter: "agNumberColumnFilter",
    sortable: true,
    resizable: true,
    cellStyle: (params) => {
      const currentStock = Number(params.data?.Current_Stock);
      if (currentStock < 0) {
        return {
          backgroundColor: "orange",
          color: "#fff",
          fontWeight: "600",
        };
      }
      return null; // Return null instead of an empty object
    },
  };
}
    if (isMainDateColumn(field)) {
      return {
        field,
        filter: "agDateColumnFilter",
        sortable: true,
        resizable: true,
        cellStyle: {
          cursor: "pointer",
          color: "#007bff",
          textDecoration: "underline",
        },
        onCellClicked: onClickCell
          ? (params) => onClickCell({ type: field, value: params.value })
          : undefined,
      };
    }

    if (isProbablyDate(field, sampleValue)) {
      return {
        field,
        filter: "agDateColumnFilter",
        sortable: true,
        resizable: true,
      };
    }

    if (isProbablyNumber(field, sampleValue)) {
      const isPercentage = lower.includes("percent") || lower.includes("percentage");
      const isPrice = lower.includes("price");
      const isTotal = lower.includes("total") || lower.includes("amount");

      return {
        field,
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: (params) => {
          const val = Number(params.value);
          if (isNaN(val)) return '';
          if (isPercentage) return formatPercentageValue(val);
          if (isPrice) return currencyFormatter(val);
          if (isTotal) return numberFormatter(val);
          return val.toString();
        },
        cellStyle: (params) => {
          const val = Number(params.data?.[field]);
          if (isNaN(val)) return null;
          if (isPercentage) return percentageCellStyle(val);
          if (isPrice) return currencyCellStyle();
          return null;
        },
      };
    }

    if (isProbablyBoolean(field, sampleValue)) {
      return {
        field,
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
      };
    }

    return {
      field,
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      filterParams: {
        debounceMs: 200,
      },
    };
  });

  if (hasDaysFields) {
    columns.push({
  headerName: "Days_to_Sellout",
  field: "Days_to_Sellout",
  valueGetter: (params) => {
    const currentStock = Number(params.data?.Current_Stock) || 0;
    const daysSoldOutPast = Number(params.data?.Days_Sold_Out_Past) || 0;
    const launch = Number(params.data?.days_since_launch) || 0;
    const projected = Number(params.data?.Projected_Days_to_Sellout) || 0;

    let daysToSellout = launch + projected;
    if (currentStock <= 0 && daysSoldOutPast > 0) {
      daysToSellout = daysSoldOutPast;
    }

    return round2(daysToSellout); // ✅ round2 added here
  },
  valueFormatter: (params) => numberFormatter(params.value),
  cellStyle: (params) => {
    const value = Number(params.value);
    const currentStock = Number(params.data?.Current_Stock);
    const allTimeTotalQuantity = Number(params.data?.Alltime_Total_Quantity);
    const daysSoldOutPast = params.data?.Days_Sold_Out_Past;

    if (daysSoldOutPast !== undefined && currentStock < 0) {
      return {
        backgroundColor: "orange",
        color: "#fff",
        fontWeight: "600",
      };
    }

    if ((currentStock <= 0) && (allTimeTotalQuantity > 0)) {
      return {
        backgroundColor: "orange",
        color: "#fff",
        fontWeight: "600",
      };
    }

    if (isNaN(value)) {
      return null;
    }

    return {
      backgroundColor: rgb(value > selloutThreshold ? dngRgb : scsRgb),
      color: "#fff",
      fontWeight: "500",
    };
  },
  filter: "agNumberColumnFilter",
  sortable: true,
  resizable: true,
}
);
    // Add Days_Since_Last_Sale column
    columns.push({
      headerName: "Days_Since_Last_Sale",
      field: "Days_Since_Last_Sale",
      valueGetter: (params) => {
        const lastSoldDate = params.data?.Last_Sold_Date;
        if (!lastSoldDate || (typeof lastSoldDate !== 'string' && typeof lastSoldDate !== 'number')) return null;
        const lastDate = new Date(lastSoldDate);
        if (isNaN(lastDate.getTime())) return null;
        const now = new Date();
        // Zero out time for both dates
        lastDate.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        const diffMs = now.getTime() - lastDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      },
      valueFormatter: (params) => params.value == null ? "-" : params.value,
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
    });
  }


  if (hasDaysFields && hasPerDayQty) {
    columns.push(
      {
        headerName: "Projected_Quantity_Sold",
        field: "Projected_Quantity_Sold",
        valueGetter: (params) => {
          const perDay = Number(params.data?.Alltime_Perday_Quantity) || 0;
          return round2(perDay * projectedQtyThreshold);
        },
        valueFormatter: (params) => numberFormatter(params.value),
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
      },
      {
        headerName: "Expected Sales (Within Stock)",
        field: "Expected_Sales_Within_Stock",
        valueGetter: (params) => {
          const perDay = Number(params.data?.Alltime_Perday_Quantity) || 0;
          const stock = Number(params.data?.Current_Stock) || 0;
          const projected = perDay * projectedQtyThreshold;
          return round2(Math.min(projected, stock));
        },
        valueFormatter: (params) => numberFormatter(params.value),
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
      }
    );
  }

  return columns;
};
