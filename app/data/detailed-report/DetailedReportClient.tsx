// "use client"

// import { useSearchParams } from 'next/navigation';
// import { useState, useEffect } from 'react';
// import SmartDropdown from '@/components/custom-ui/dropdown2';
// import DataGrid from '@/components/data/DataGrid';
// import { fetchSaleReportDetailed } from '@/lib/data/dataapi';
// import { AppModal } from '@/components/custom-ui/app-modal';
// import { Button } from '@/components/custom-ui/button2';

// const getGroupByOptions = (brandName: string) => {
//     const isBeelittle = brandName?.toLowerCase() === "beelittle";
//     const categoryLabel = isBeelittle ? "Product_Type" : "Category";

//     return [
//         { label: categoryLabel, value: categoryLabel },
//         { label: "Item_Type", value: "Item_Type" },
//         { label: "Item_Name", value: "Item_Name" },
//         { label: "Target_Column", value: "Target_Column" },
//     ];
// };

// export default function DetailedReportClient() {
//     const searchParams = useSearchParams();
//     const date = searchParams.get('date');
//     const end_date = searchParams.get('end_date');
//     const brand = searchParams.get('brand');
//     const item_filter = searchParams.get('item_filter');
//     const aggregationtype = searchParams.get('aggregation');

//     const Start_Date = date ?? "";
//     const End_Date = end_date ?? "";
//     const business = brand ?? "";
//     const aggregation = aggregationtype ?? "";
//     const [PopupModalOpen, setPopupModalOpen] = useState(false);
//     const [PopupModalData, setPopupModalData] = useState<any>(null);
//     const [GroupBy, setGroupBy] = useState("Target_Column");
//     const [data, setData] = useState<any[]>([]);
//     const [title, setTitle] = useState<any>(null);
//     const [isFetching, setIsFetching] = useState(false);

//     let parsedItemFilter: any = undefined;
//     if (item_filter) {
//         try {
//             parsedItemFilter = JSON.parse(item_filter);
//         } catch {
//             parsedItemFilter = undefined;
//         }
//     }

//     useEffect(() => {
//         if (Start_Date && business) {
//             handleGroupedFetch();
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     const handleGroupedFetch = async () => {
//         try {
//             setIsFetching(true);
//             const result = await fetchSaleReportDetailed({
//                 Start_Date,
//                 End_Date,
//                 business,
//                 aggregation,
//                 col: "total",
//                 group_by: GroupBy,
//                 item_filter: parsedItemFilter,
//             });
//             setData(result?.data || []);
//         } catch (error) {
//             console.error("Fetch error:", error);
//         } finally {
//             setIsFetching(false);
//         }
//     };

//     const handleTargetClick = async (params: { type: any; value: any }) => {
//         const type = String(params.type).toLowerCase();
//         if (type === "stock_by_age" || type === "sales_by_age") {
//             setPopupModalData(params.value);
//             setPopupModalOpen(true);
//             setTitle(type === "stock_by_age" ? "Stock By Age" : "Sales By Age");
//         } else {
//             console.log("onTargetClick event:", params);
//         }
//     };

//     const filteredData = data.map(({ Date, ...rest }) => rest);

//     return (
//         <div className="w-full flex flex-col gap-4 mb-4 bg-themeBase-l1 p-x20">
//             <div className="text-base font-medium text-gray-800 mb-2">
//                 {End_Date
//                     ? <>Date range - {Start_Date} to {End_Date}</>
//                     : <>Date - {Start_Date}</>
//                 }
//             </div>
//             <div className="p-x20 bg-themeBase flex flex-col gap-x15 rounded-[10px] ">
//                 <div className="flex items-end gap-x20">
//                     <div style={{ width: "20%" }}>
//                         <label className="text-12 font-normal text-ltxt mb-1">
//                             Group By <span className="text-dng">*</span>
//                         </label>
//                         <SmartDropdown
//                             options={getGroupByOptions(brand as string)}
//                             value={GroupBy}
//                             onChange={(val) => setGroupBy(val as string)}
//                             placeholder="Select"
//                             multiSelector
//                         />
//                     </div>

//                     <Button
//                         style={{ width: "10%" }}
//                         onClick={handleGroupedFetch}
//                         className="!h-[40px]"
//                         disabled={GroupBy.length === 0 || isFetching}
//                         variant='primary'
//                     >
//                         {isFetching ? 'Fetching...' : 'Fetch Data'}
//                     </Button>
//                 </div>

//                 <DataGrid rowData={filteredData} onTargetClick={handleTargetClick} brandName={brand || ""} />
//             </div>

//             <AppModal
//                 open={PopupModalOpen}
//                 onClose={() => setPopupModalOpen(false)}
//                 title={title}
//                 size="2xl"
//             >
//                 <div className="flex flex-col items-center h-full min-h-[300px] overflow-y-auto w-full">
//                     <DataGrid
//                         rowData={PopupModalData}
//                         onTargetClick={handleTargetClick}
//                         brandName={brand || ""}
//                     />
//                 </div>
//             </AppModal>
//         </div>
//     );
// }
