import { useState } from "react";
import { updateTargetEntry } from "@/lib/data/dataapi";
import { useUser } from '@/hooks/usercontext';

interface DailyTarget {
    Business_Name: string;
    Target_Column: string;
    Target_Key: string;
    Start_Date: string;
    Target_Value?: number;
    Uploaded_At?: string;
    Status_History?: { status: boolean; timestamp: string }[];
    Status?: boolean;
}

interface DailyTargetListProps {
    targets: DailyTarget[];
    businessName: string;
    onTargetsChange?: (updatedTargets: DailyTarget[]) => void;
}

export default function DailyTargetList({ targets: initialTargets, businessName, onTargetsChange }: DailyTargetListProps) {
    const [targets, setTargets] = useState<DailyTarget[]>(initialTargets);
    const [updating, setUpdating] = useState<string | null>(null);
    const { user } = useUser(); // Get user context

    const handleValueChange = (idx: number, value: number) => {
        const updated = targets.map((t, i) => (i === idx ? { ...t, Target_Value: value } : t));
        setTargets(updated);
        onTargetsChange?.(updated);
    };

    // Helper to build update payload
    // Helper to build update payload
    function buildUpdatePayload(target: DailyTarget, options?: { status?: boolean; value?: number }) {
        const payload: any = {
            Business_Name: target.Business_Name,
            Target_Column: target.Target_Column,
            Target_Key: target.Target_Key,
            Start_Date: target.Start_Date,
        };
        if (options?.status !== undefined) {
            payload.status = options.status;
        }
        if (options?.value !== undefined) {
            payload.Target_Value = options.value;
        }
        return payload;
    }

    // Handle deactivate
    const handleDeactivate = async (target: DailyTarget) => {
        setUpdating((target.Target_Key ?? "") + (target.Start_Date ?? ""));
        try {
            await updateTargetEntry(buildUpdatePayload(target, { status: false }));
            const updated = targets.map(t =>
                t.Target_Key === target.Target_Key && t.Start_Date === target.Start_Date
                    ? { ...t, Status: false }
                    : t
            );
            setTargets(updated);
            onTargetsChange?.(updated);
        } catch {
            alert("Failed to deactivate target");
        } finally {
            setUpdating(null);
        }
    };

    const handleActivate = async (target: DailyTarget) => {
        setUpdating((target.Target_Key ?? "") + (target.Start_Date ?? ""));
        try {
            await updateTargetEntry(buildUpdatePayload(target, { status: true }));
            const updated = targets.map(t =>
                t.Target_Key === target.Target_Key && t.Start_Date === target.Start_Date
                    ? { ...t, Status: true }
                    : t
            );
            setTargets(updated);
            onTargetsChange?.(updated);
        } catch {
            alert("Failed to activate target");
        } finally {
            setUpdating(null);
        }
    };

    // Handle value update (on blur)
    const handleValueUpdate = async (target: DailyTarget) => {
        setUpdating((target.Target_Key ?? "") + (target.Start_Date ?? ""));
        try {
            if (target.Target_Value !== undefined) {
                await updateTargetEntry(buildUpdatePayload(target, { value: target.Target_Value }));
            }
        } catch {
            alert("Failed to update value");
        } finally {
            setUpdating(null);
        }
    };


    const handleDelete = async (target: DailyTarget) => {
        const firstConfirm = window.confirm("Are you sure you want to delete this target?");
        if (!firstConfirm) return;
        const secondConfirm = window.confirm("This action cannot be undone. Confirm delete?");
        if (!secondConfirm) return;

        setUpdating((target.Target_Key ?? "") + (target.Start_Date ?? ""));
        try {
            await updateTargetEntry({
                Business_Name: target.Business_Name,
                Target_Column: target.Target_Column,
                Target_Key: target.Target_Key,
                Start_Date: target.Start_Date,
                is_deleted: true,
            });
            const updated = targets.filter(
                t => !(t.Target_Key === target.Target_Key && t.Start_Date === target.Start_Date)
            );
            setTargets(updated);
            onTargetsChange?.(updated);
        } catch {
            alert("Failed to delete target");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="pb-x20 px-x20 bg-white w-[100%]">
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Targets</h2> */}
            <div className="flex flex-col gap-2">
                {/* Header Row */}
                <div className="flex text-12 font-normal text-ltxt border-b pb-3 gap-4">
                    <div className="w-[23%]">Target Column</div>
                    <div className="w-[23%]">Target Key</div>
                    <div className="w-[12%]">Start Date</div>
                    <div className="w-[12%]">Target Value</div>
                    <div className="w-[10%]">Status</div>
                    <div className="w-[20%]">Action</div>
                </div>

                {/* Data Rows */}
                {targets.map((t, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 border-b py-3 hover:bg-gray-50 transition-colors text-sm text-gray-800"
                    >
                        <div className="w-[23%] truncate">{t.Target_Column}</div>
                        <div className="w-[23%] truncate">{t.Target_Key}</div>
                        <div className="w-[12%]">{t.Start_Date ?? "-"}</div>
                        <div className="w-[12%]">
                            <input
                                type="number"
                                className="border rounded-lg px-2 py-1 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                value={t.Target_Value ?? ""}
                                min={0}
                                onChange={e => handleValueChange(i, Number(e.target.value))}
                                onBlur={() => handleValueUpdate(t)}
                                disabled={
                                    updating === (t.Target_Key ?? "") + (t.Start_Date ?? "") ||
                                    !(user?.permissions?.admin)
                                }
                            />
                        </div>
                        <div className="w-[10%]">
                            <span
                                className={
                                    t.Status === undefined
                                        ? "text-gray-400"
                                        : t.Status
                                            ? "text-green-600 font-medium"
                                            : "text-gray-400"
                                }
                            >
                                {t.Status === undefined ? "-" : t.Status ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div className="w-[20%]">
                            {t.Status === true && (
                                <button
                                    className="px-3 py-1 rounded-lg bg-newsecondary hover:bg-newsecondary/70 text-white text-xs disabled:opacity-50"
                                    onClick={() => handleDeactivate(t)}
                                    disabled={
                                        updating === (t.Target_Key ?? "") + (t.Start_Date ?? "") ||
                                        !(user?.permissions?.admin)
                                    }
                                >
                                    {updating === (t.Target_Key ?? "") + (t.Start_Date ?? "")
                                        ? "Updating..."
                                        : "Deactivate"}
                                </button>
                            )}
                            {t.Status === false && (
                                <button
                                    className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50"
                                    onClick={() => handleActivate(t)}
                                    disabled={
                                        updating === (t.Target_Key ?? "") + (t.Start_Date ?? "") ||
                                        !(user?.permissions?.admin)
                                    }
                                >
                                    {updating === (t.Target_Key ?? "") + (t.Start_Date ?? "")
                                        ? "Updating..."
                                        : "Activate"}
                                </button>
                            )}
                            {/* Delete button, always shown for admin */}
                            <button
                                className="ml-2 px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs disabled:opacity-50"
                                onClick={() => handleDelete(t)}
                                disabled={
                                    updating === (t.Target_Key ?? "") + (t.Start_Date ?? "") ||
                                    !(user?.permissions?.admin)
                                }
                            >
                                {updating === (t.Target_Key ?? "") + (t.Start_Date ?? "")
                                    ? "Updating..."
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

}
