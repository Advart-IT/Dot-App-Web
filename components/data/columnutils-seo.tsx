// Handles query_totals format (array of objects with query, current_period.query_totals, comparison_period.query_totals)
export type RowSEOQueryTotals = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  period: string; // 'current' or 'previous'
};

// Map query_totals format to rows
export function mapQueryTotalsToRows(raw: any[]): RowSEOQueryTotals[] {
  const rows: RowSEOQueryTotals[] = [];
  raw.forEach(item => {
    if (item.comparison_period?.query_totals) {
      rows.push({
        query: item.query ?? '',
        clicks: item.comparison_period.query_totals.clicks ?? 0,
        impressions: item.comparison_period.query_totals.impressions ?? 0,
        ctr: item.comparison_period.query_totals.ctr ?? 0,
        position: item.comparison_period.query_totals.position ?? 0,
        period: 'previous',
      });
    }
    if (item.current_period?.query_totals) {
      rows.push({
        query: item.query ?? '',
        clicks: item.current_period.query_totals.clicks ?? 0,
        impressions: item.current_period.query_totals.impressions ?? 0,
        ctr: item.current_period.query_totals.ctr ?? 0,
        position: item.current_period.query_totals.position ?? 0,
        period: 'current',
      });
    }
  });
  return rows;
}

// Column defs for query_totals format
export function generateQueryTotalsColumnDefs(): ColDef<RowSEOQueryTotals>[] {
  return [
    {
      headerName: 'Period',
      field: 'period',
      filter: 'agTextColumnFilter',
      sortable: true,
      resizable: true,
      minWidth: 100,
      valueFormatter: ({ value }) => value === 'current' ? 'Current' : value === 'previous' ? 'Previous' : '',
    },
    {
      headerName: 'Query',
      field: 'query',
      filter: 'agTextColumnFilter',
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'Clicks',
      field: 'clicks',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'Impressions',
      field: 'impressions',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'CTR',
      field: 'ctr',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => typeof value === 'number' ? (value * 100).toFixed(2) + '%' : '',
    },
    {
      headerName: 'Position',
      field: 'position',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => typeof value === 'number' ? value.toFixed(2) : '',
    },
  ];
}
// Color mapping for user types
import type { ColDef } from "ag-grid-community";

export type RowSEO = {
  date_start: Date | null;
  date_end: Date | null;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

// Enhanced: Handles both page-level and site-level (site_totals) GSC data
export function mapGSCToRows(raw: any[]): RowSEO[] {
  const rows: (RowSEO & { period?: string })[] = [];
  raw.forEach(item => {
    // If site-level summary (site_totals), treat as a single row
    if (item.current_period?.site_totals) {
      // Only insert comparison period if it exists, else only current
      if (item.comparison_period?.site_totals && item.comparison_period?.date_range?.start && item.comparison_period?.date_range?.end) {
        rows.push({
          date_start: new Date(item.comparison_period.date_range.start),
          date_end: new Date(item.comparison_period.date_range.end),
          page_url: item.site ?? item.site_url ?? item.site_name ?? "(site)",
          clicks: item.comparison_period.site_totals.clicks ?? 0,
          impressions: item.comparison_period.site_totals.impressions ?? 0,
          ctr: item.comparison_period.site_totals.ctr ?? 0,
          position: item.comparison_period.site_totals.position ?? 0,
          period: "previous",
        });
        rows.push({
          date_start: item.current_period?.date_range?.start ? new Date(item.current_period.date_range.start) : null,
          date_end: item.current_period?.date_range?.end ? new Date(item.current_period.date_range.end) : null,
          page_url: item.site ?? item.site_url ?? item.site_name ?? "(site)",
          clicks: item.current_period.site_totals.clicks ?? 0,
          impressions: item.current_period.site_totals.impressions ?? 0,
          ctr: item.current_period.site_totals.ctr ?? 0,
          position: item.current_period.site_totals.position ?? 0,
          period: "current",
        });
      } else {
        rows.push({
          date_start: item.current_period?.date_range?.start ? new Date(item.current_period.date_range.start) : null,
          date_end: item.current_period?.date_range?.end ? new Date(item.current_period.date_range.end) : null,
          page_url: item.site ?? item.site_url ?? item.site_name ?? "(site)",
          clicks: item.current_period.site_totals.clicks ?? 0,
          impressions: item.current_period.site_totals.impressions ?? 0,
          ctr: item.current_period.site_totals.ctr ?? 0,
          position: item.current_period.site_totals.position ?? 0,
          period: "current",
        });
      }
    } else {
      // Page-level (original logic)
      if (item.comparison_period?.page_totals && item.comparison_period?.date_range?.start && item.comparison_period?.date_range?.end) {
        rows.push({
          date_start: new Date(item.comparison_period.date_range.start),
          date_end: new Date(item.comparison_period.date_range.end),
          page_url: item.page_url ?? "",
          clicks: item.comparison_period.page_totals.clicks ?? 0,
          impressions: item.comparison_period.page_totals.impressions ?? 0,
          ctr: item.comparison_period.page_totals.ctr ?? 0,
          position: item.comparison_period.page_totals.position ?? 0,
          period: "previous",
        });
        rows.push({
          date_start: item.current_period?.date_range?.start ? new Date(item.current_period.date_range.start) : null,
          date_end: item.current_period?.date_range?.end ? new Date(item.current_period.date_range.end) : null,
          page_url: item.page_url ?? "",
          clicks: item.current_period?.page_totals?.clicks ?? 0,
          impressions: item.current_period?.page_totals?.impressions ?? 0,
          ctr: item.current_period?.page_totals?.ctr ?? 0,
          position: item.current_period?.page_totals?.position ?? 0,
          period: "current",
        });
      } else {
        rows.push({
          date_start: item.current_period?.date_range?.start ? new Date(item.current_period.date_range.start) : null,
          date_end: item.current_period?.date_range?.end ? new Date(item.current_period.date_range.end) : null,
          page_url: item.page_url ?? "",
          clicks: item.current_period?.page_totals?.clicks ?? 0,
          impressions: item.current_period?.page_totals?.impressions ?? 0,
          ctr: item.current_period?.page_totals?.ctr ?? 0,
          position: item.current_period?.page_totals?.position ?? 0,
          period: "current",
        });
      }
    }
  });
  return rows;
}

export function generateSeoColumnDefs(): ColDef<RowSEO>[] {
  return [
    {
      headerName: "Start_Date",
      field: "date_start",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
      filterParams: {
        comparator: (filterDate: Date, cellValue: Date | null) => {
          if (!cellValue) return -1;
          // Compare only year, month, day
          const cellYear = cellValue.getFullYear();
          const cellMonth = cellValue.getMonth();
          const cellDay = cellValue.getDate();
          const filterYear = filterDate.getFullYear();
          const filterMonth = filterDate.getMonth();
          const filterDay = filterDate.getDate();

          if (cellYear < filterYear) return -1;
          if (cellYear > filterYear) return 1;
          if (cellMonth < filterMonth) return -1;
          if (cellMonth > filterMonth) return 1;
          if (cellDay < filterDay) return -1;
          if (cellDay > filterDay) return 1;
          return 0;
        },
      },
    },
    {
      headerName: "End_Date",
      field: "date_end",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
      filterParams: {
        comparator: (filterDate: Date, cellValue: Date | null) => {
          if (!cellValue) return -1;
          const cellYear = cellValue.getFullYear();
          const cellMonth = cellValue.getMonth();
          const cellDay = cellValue.getDate();
          const filterYear = filterDate.getFullYear();
          const filterMonth = filterDate.getMonth();
          const filterDay = filterDate.getDate();

          if (cellYear < filterYear) return -1;
          if (cellYear > filterYear) return 1;
          if (cellMonth < filterMonth) return -1;
          if (cellMonth > filterMonth) return 1;
          if (cellDay < filterDay) return -1;
          if (cellDay > filterDay) return 1;
          return 0;
        },
      },
    },
    {
      headerName: "Page URL",
      field: "page_url",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      cellRenderer: (params: any) => {
        const url = params.value;
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : "";
      },
    },
    {
      headerName: "Clicks",
      field: "clicks",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "Impressions",
      field: "impressions",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "CTR",
      field: "ctr",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }: { value: any }) =>
        typeof value === "number" ? (value * 100).toFixed(2) + "%" : "",
    },
    {
      headerName: "Position",
      field: "position",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }: { value: any }) =>
        typeof value === "number" ? value.toFixed(2) : "",
    },
  ];
}



// Enhanced: Optionally includes date_start and date_end for comparison
export type RowSEOQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date_start?: Date | null;
  date_end?: Date | null;
  period?: string; // 'current' or 'comparison'
};


// Enhanced: Adds date_start/date_end/period if comparison is present
export function mapQueriesToRows(raw: any): RowSEOQuery[] {
  const rows: RowSEOQuery[] = [];

  // Helper to add period info if available
  const pushRows = (period?: any, periodName?: string) => {
    if (period?.query_rows && Array.isArray(period.query_rows)) {
      const date_start = period?.date_range?.start ? new Date(period.date_range.start) : null;
      const date_end = period?.date_range?.end ? new Date(period.date_range.end) : null;
      period.query_rows.forEach((q: any) => {
        rows.push({
          query: q?.query ?? "",
          clicks: q?.clicks ?? 0,
          impressions: q?.impressions ?? 0,
          ctr: q?.ctr ?? 0,
          position: q?.position ?? 0,
          ...(date_start ? { date_start } : {}),
          ...(date_end ? { date_end } : {}),
          ...(periodName ? { period: periodName === "comparison" ? "previous" : periodName } : {}),
        });
      });
    }
  };

  pushRows(raw?.current_period, "current");
  pushRows(raw?.comparison_period, "previous");

  return rows;
}

// Enhanced: Adds date_start/date_end/period columns if present in data
// Accepts an optional argument to control if date columns are shown
export function generateSeoQueryColumnDefs(showDateCols = true): ColDef<RowSEOQuery>[] {
  const base: ColDef<RowSEOQuery>[] = [];
  if (showDateCols) {
    base.push({
      headerName: "Start Date",
      field: "date_start",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
    });
    base.push({
      headerName: "End Date",
      field: "date_end",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
    });
  }
  base.push(
    {
      headerName: "Query",
      field: "query",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "Clicks",
      field: "clicks",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "Impressions",
      field: "impressions",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "CTR",
      field: "ctr",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) =>
        typeof value === "number" ? (value * 100).toFixed(2) + "%" : "",
    },
    {
      headerName: "Position",
      field: "position",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) =>
        typeof value === "number" ? value.toFixed(2) : "",
    }
  );
  return base;
}

export type RowSEOSummary = {
  date_start: Date | null;
  date_end: Date | null;
  page_url: string;
  // Dynamic keys for each user type and metric
  [key: string]: any;
};

export function mapSummaryToRows(raw: any[], selectedTypes: string[]): RowSEOSummary[] {
  const rows: RowSEOSummary[] = [];
  raw.forEach(item => {
    // Only push 'current' period row if 'previous' is null
    if (!item.previous && !item.previous_total) {
      // Helper to process a period (current only)
      function processCurrentPeriod() {
        const date_start = item.ranges?.current?.start ? new Date(item.ranges.current.start) : null;
        const date_end = item.ranges?.current?.end ? new Date(item.ranges.current.end) : null;
        const page_url = item.domain && item.url ? `https://${item.domain}${item.url}` : "";
        const allRows = [
          ...(item.current_total || []),
          ...(item.current || []),
        ];
        const row: any = { date_start, date_end, page_url, period: "current" };
        selectedTypes.forEach(type => {
          const userObj = allRows.find((row: any) => {
            const normType = (row.newVsReturning || "").replace(/\(|\)|\s+/g, "").toLowerCase();
            const normSelected = type.replace(/\(|\)|\s+/g, "").toLowerCase();
            return normType === normSelected;
          });
          row[`${type}_totalUsers`] = userObj ? Number(userObj.totalUsers) : 0;
          row[`${type}_newUsers`] = userObj ? Number(userObj.newUsers) : 0;
          row[`${type}_sessions`] = userObj ? Number(userObj.sessions) : 0;
          row[`${type}_screenPageViews`] = userObj ? Number(userObj.screenPageViews) : 0;
          row[`${type}_bounceRate`] = userObj ? Number(userObj.bounceRate) : 0;
          row[`${type}_averageSessionDuration`] = userObj ? Number(userObj.averageSessionDuration) : 0;
          row[`${type}_userEngagementDuration`] = userObj ? Number(userObj.userEngagementDuration) : 0;
          row[`${type}_itemViews`] = userObj ? Number(userObj.itemViews) : 0;
          row[`${type}_addToCarts`] = userObj ? Number(userObj.addToCarts) : 0;
          row[`${type}_checkouts`] = userObj ? Number(userObj.checkouts) : 0;
        });
        rows.push(row);
      }
      processCurrentPeriod();
    } else {
      // If previous exists, push both periods (current and previous)
      function processPeriod(periodKey: "current" | "previous", totalKey: "current_total" | "previous_total") {
        const date_start = item.ranges?.[periodKey]?.start ? new Date(item.ranges[periodKey].start) : null;
        const date_end = item.ranges?.[periodKey]?.end ? new Date(item.ranges[periodKey].end) : null;
        const page_url = item.domain && item.url ? `https://${item.domain}${item.url}` : "";
        const allRows = [
          ...(item[totalKey] || []),
          ...(item[periodKey] || []),
        ];
        const row: any = { date_start, date_end, page_url, period: periodKey };
        selectedTypes.forEach(type => {
          const userObj = allRows.find((row: any) => {
            const normType = (row.newVsReturning || "").replace(/\(|\)|\s+/g, "").toLowerCase();
            const normSelected = type.replace(/\(|\)|\s+/g, "").toLowerCase();
            return normType === normSelected;
          });
          row[`${type}_totalUsers`] = userObj ? Number(userObj.totalUsers) : 0;
          row[`${type}_newUsers`] = userObj ? Number(userObj.newUsers) : 0;
          row[`${type}_sessions`] = userObj ? Number(userObj.sessions) : 0;
          row[`${type}_screenPageViews`] = userObj ? Number(userObj.screenPageViews) : 0;
          row[`${type}_bounceRate`] = userObj ? Number(userObj.bounceRate) : 0;
          row[`${type}_averageSessionDuration`] = userObj ? Number(userObj.averageSessionDuration) : 0;
          row[`${type}_userEngagementDuration`] = userObj ? Number(userObj.userEngagementDuration) : 0;
          row[`${type}_itemViews`] = userObj ? Number(userObj.itemViews) : 0;
          row[`${type}_addToCarts`] = userObj ? Number(userObj.addToCarts) : 0;
          row[`${type}_checkouts`] = userObj ? Number(userObj.checkouts) : 0;
        });
        rows.push(row);
      }
      processPeriod("current", "current_total");
      processPeriod("previous", "previous_total");
    }
  });
  return rows;
}

// Color mapping for user types
const userTypeColors: Record<string, string> = {
  total: '#e3f2fd',
  new: '#cbcecbff',
  returning: '#e0deccff',
  'not set': '#f3e5f5',
  '(not set)': '#f3e5f5'
};

function normalizeType(type: string) {
  return type.replace(/\(|\)/g, '').replace(/\s+/g, '').toLowerCase();
}

function getUserTypeColor(type: string) {
  const norm = normalizeType(type);
  if (norm === 'total') return userTypeColors.total;
  if (norm === 'new') return userTypeColors.new;
  if (norm === 'returning') return userTypeColors.returning;
  if (norm === 'notset') return userTypeColors['not set'];
  return undefined;
}

function capitalizeType(type: string) {
  if (type === '(not set)' || type === 'not set') return 'Not Set';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function generateSeoSummaryColumnDefs(selectedTypes: string[]): ColDef<any>[] {
  const baseCols: ColDef<any>[] = [
    {
      headerName: "Period",
      field: "period",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 100,
      valueFormatter: ({ value }) => value === "current" ? "Current" : value === "previous" ? "Previous" : "",
    },
    {
      headerName: "Start_Date",
      field: "date_start",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
      minWidth: 120,
    },
    {
      headerName: "End_Date",
      field: "date_end",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => (value ? value.toISOString().slice(0, 10) : ""),
      minWidth: 120,
    },
    {
      headerName: "Page URL",
      field: "page_url",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const url = params.value;
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : "";
      },
    },
  ];

  // Metrics to show for each user type
  const metrics = [
    { key: "totalUsers", name: "Total Users" },
    { key: "newUsers", name: "New Users" },
    { key: "sessions", name: "Sessions" },
    { key: "screenPageViews", name: "Page Views" },
    { key: "bounceRate", name: "Bounce Rate", formatter: (v: any) => typeof v === "number" ? (v * 100).toFixed(2) + "%" : "" },
    { key: "averageSessionDuration", name: "Avg. Session Duration", formatter: (v: any) => typeof v === "number" ? v.toFixed(2) + "s" : "" },
    { key: "userEngagementDuration", name: "Engagement Duration" },
    { key: "itemViews", name: "Item Views" },
    { key: "addToCarts", name: "Add To Carts" },
    { key: "checkouts", name: "Checkouts" },
  ];

  // Add columns for each selected user type and metric
  selectedTypes.forEach(type => {
    const capType = capitalizeType(type);
    const color = getUserTypeColor(type);
    metrics.forEach(metric => {
      baseCols.push({
        headerName: `${capType} ${metric.name}`,
        field: `${type}_${metric.key}`,
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 120,
        ...(metric.formatter ? { valueFormatter: ({ value }) => metric.formatter(value) } : {}),
        headerStyle: color ? { background: color, borderRadius: 6 } : {},
      });
    });
  });

  return baseCols;
}

export function mapDailySummaryToRows(raw: any[], selectedTypes: string[]): RowSEOSummary[] {
  const rows: RowSEOSummary[] = [];
  // Helper to normalize type for matching
  function normalizeType(type: string) {
    return type.replace(/\(|\)/g, '').replace(/\s+/g, '').toLowerCase();
  }

  raw.forEach(item => {
    // Gather all dates from current_total and current
    const allDates = new Set<string>();
    if (item.current_total) item.current_total.forEach((row: any) => allDates.add(row.date));
    if (item.current) item.current.forEach((row: any) => allDates.add(row.date));

    Array.from(allDates).forEach(dateStr => {
      // Format date: "20250901" -> "2025-09-01"
      const dateFmt = dateStr ? `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}` : "";

      const row: any = {
        date: dateFmt,
        page_url: item.domain && item.url ? `https://${item.domain}${item.url}` : "",
      };

      selectedTypes.forEach(type => {
        const normSelected = normalizeType(type);
        // Find the userObj for this type and date in both arrays
        const userObj =
          (item.current_total || []).find((r: any) => r.date === dateStr && normalizeType(r.newVsReturning || "total") === normSelected) ||
          (item.current || []).find((r: any) => r.date === dateStr && normalizeType(r.newVsReturning || "total") === normSelected);

        row[`${type}_totalUsers`] = userObj ? Number(userObj.totalUsers) : 0;
        row[`${type}_newUsers`] = userObj ? Number(userObj.newUsers) : 0;
        row[`${type}_sessions`] = userObj ? Number(userObj.sessions) : 0;
        row[`${type}_screenPageViews`] = userObj ? Number(userObj.screenPageViews) : 0;
        row[`${type}_bounceRate`] = userObj ? Number(userObj.bounceRate) : 0;
        row[`${type}_averageSessionDuration`] = userObj ? Number(userObj.averageSessionDuration) : 0;
        row[`${type}_userEngagementDuration`] = userObj ? Number(userObj.userEngagementDuration) : 0;
        row[`${type}_itemViews`] = userObj ? Number(userObj.itemViews) : 0;
        row[`${type}_addToCarts`] = userObj ? Number(userObj.addToCarts) : 0;
        row[`${type}_checkouts`] = userObj ? Number(userObj.checkouts) : 0;
      });

      rows.push(row);
    });
  });
  return rows;
}

export function generateDailySummaryColumnDefs(selectedTypes: string[]): ColDef<any>[] {
  const baseCols: ColDef<any>[] = [
    {
      headerName: "Date",
      field: "date",
      filter: "agDateColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 120,
    },
    {
      headerName: "Page URL",
      field: "page_url",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const url = params.value;
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : "";
      },
    },
  ];
  // Metrics to show for each user type
  const metrics = [
    { key: "totalUsers", name: "Total Users" },
    { key: "newUsers", name: "New Users" },
    { key: "sessions", name: "Sessions" },
    { key: "screenPageViews", name: "Page Views" },
    { key: "bounceRate", name: "Bounce Rate", formatter: (v: any) => typeof v === "number" ? (v * 100).toFixed(2) + "%" : "" },
    { key: "averageSessionDuration", name: "Avg. Session Duration", formatter: (v: any) => typeof v === "number" ? v.toFixed(2) + "s" : "" },
    { key: "userEngagementDuration", name: "Engagement Duration" },
    { key: "itemViews", name: "Item Views" },
    { key: "addToCarts", name: "Add To Carts" },
    { key: "checkouts", name: "Checkouts" },
  ];

  selectedTypes.forEach(type => {
    const capType = type;
    const color = userTypeColors[normalizeType(type)] || undefined;
    metrics.forEach(metric => {
      baseCols.push({
        headerName: `${capType} ${metric.name}`,
        field: `${type}_${metric.key}`,
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 120,
        ...(metric.formatter ? { valueFormatter: ({ value }) => metric.formatter(value) } : {}),
        ...(color ? { headerStyle: { background: color, borderRadius: 6 } } : {}),
      });
    });
  });

  return baseCols;
}

// Types for indexed pages data
export type RowIndexedPage = {
  s_no: number;
  page_url: string;
  issue_type?: string;
  issue_count?: number;
};

// Map indexed pages data to rows
export function mapIndexedPagesToRows(raw: any[]): RowIndexedPage[] {
  return raw.map(item => ({
    s_no: item.s_no ?? 0,
    page_url: item.page_url ?? "",
    issue_type: item.issue_type,
    issue_count: item.issue_count,
  }));
}

// Generate column definitions for indexed pages based on tab type
export function generateIndexedPagesColumnDefs(tabType: 'no_issues' | 'with_issues' | 'not_indexed'): ColDef<RowIndexedPage>[] {
  const baseCols: ColDef<RowIndexedPage>[] = [
    {
      headerName: "S.No",
      field: "s_no",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 80,
      maxWidth: 100,
    },
    {
      headerName: "Page URL",
      field: "page_url",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 300,
      cellRenderer: (params: any) => {
        const url = params.value;
        return url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#2563eb', 
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            {url}
          </a>
        ) : "";
      },
    },
  ];

  // Add issue columns only for 'with_issues' tab
  if (tabType === 'with_issues') {
    baseCols.push(
      {
        headerName: "Issue Type",
        field: "issue_type",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 150,
      },
      {
        headerName: "Issue Count",
        field: "issue_count",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 120,
      }
    );
  }

  return baseCols;
}
