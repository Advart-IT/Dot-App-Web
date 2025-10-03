// DailyTargetList.tsx (Updated: Corrected handleDelete for robustness)
import { useState } from "react";
import { updateTargetEntry } from "@/lib/data/dataapi";
import { useUser } from '@/hooks/usercontext';
import AddTargetForm from './AddTarget';

interface DailyTarget {
  Business_Name: string;
  Target_Column: string;
  Target_Key: string;
  Start_Date: string;
  Target_Value?: number;
  Uploaded_At?: string;
  Status_History?: { status: boolean; timestamp: string }[];
  Status?: boolean;
  target_type?: string; // Add this field to the interface
  target_filter_type?: string; // Added for filtering if needed by parent
}

interface DailyTargetListProps {
  targets: DailyTarget[]; // This list may contain mixed filter types
  businessName: string;
  onTargetsChange?: (updatedTargets: DailyTarget[]) => void;
}

export default function DailyTargetList({ targets: initialTargets, businessName, onTargetsChange }: DailyTargetListProps) {
  const [targets, setTargets] = useState<DailyTarget[]>(initialTargets);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const { user } = useUser();

  // Filter targets to show only those with target_type "single_filter"
  const filteredTargets = targets.filter(target => target.target_type === "single_filter");

  const handleValueChange = (idx: number, value: number) => {
    // Update the original list state, not the filtered one
    const updated = targets.map((t, i) => (i === idx ? { ...t, Target_Value: value } : t));
    setTargets(updated);
    onTargetsChange?.(updated);
  };

  // Build payload consistently including target_filter_type
  function buildUpdatePayload(target: DailyTarget, options?: { status?: boolean; value?: number; is_deleted?: boolean }) {
    const payload: any = {
      Business_Name: target.Business_Name,
      Target_Column: target.Target_Column,
      Target_Key: target.Target_Key,
      Start_Date: target.Start_Date,
      target_filter_type: "single_filter", // Explicitly set for single filter updates
    };

    if (options?.status !== undefined) {
      payload.status = options.status;
    }
    if (options?.value !== undefined) {
      payload.Target_Value = options.value;
    }
    if (options?.is_deleted !== undefined) {
      payload.is_deleted = options.is_deleted;
    }

    return payload;
  }

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
    } catch (error) {
      console.error("Error deactivating target:", error);
      alert("Failed to deactivate target. Please check the console for details.");
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
    } catch (error) {
      console.error("Error activating target:", error);
      alert("Failed to activate target. Please check the console for details.");
    } finally {
      setUpdating(null);
    }
  };

  const handleValueUpdate = async (target: DailyTarget) => {
    setUpdating((target.Target_Key ?? "") + (target.Start_Date ?? ""));
    try {
      if (target.Target_Value !== undefined) {
        await updateTargetEntry(buildUpdatePayload(target, { value: target.Target_Value }));
        // Value update is reflected immediately in the state by handleValueChange onBlur
        // No need to explicitly update Status/Status_History here unless the API returns new ones
        // If API returns new state, we could refetch or update based on response
      }
    } catch (error) {
      console.error("Error updating target value:", error);
      alert("Failed to update target value. Please check the console for details.");
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
      // Use the same structure as other updates, including target_filter_type
      await updateTargetEntry(buildUpdatePayload(target, { is_deleted: true }));
      // Use functional update to ensure deletion is based on the latest state
      setTargets(prevTargets => {
        const updated = prevTargets.filter(
          t => !(t.Target_Key === target.Target_Key && t.Start_Date === target.Start_Date)
        );
        // Notify parent of changes *after* the local state is updated
        onTargetsChange?.(updated);
        return updated;
      });
    } catch (error) {
      console.error("Error deleting target:", error);
      alert("Failed to delete target. Please check the console for details.");
    } finally {
      setUpdating(null);
    }
  };

  const handleTargetAdded = (newTarget: DailyTarget) => {
    // Assuming newTarget from AddTargetForm has target_type = "single_filter"
    // It's better to ensure AddTargetForm sets this, but for now, we can set it here if needed
    // const updated = [...targets, {...newTarget, target_type: "single_filter"}]; // Example
    const updated = [...targets, newTarget];
    setTargets(updated);
    onTargetsChange?.(updated);
    setShowAddForm(false);
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  return (
    <div className="pb-x20 px-x20 bg-white w-[100%]">
    
      {showAddForm && (
        <AddTargetForm
          businessName={businessName}
          onTargetAdded={handleTargetAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

       <div className="flex justify-end items-center mb-4">
        <button
          onClick={toggleAddForm}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1 rounded-md text-sm"
          disabled={!(user?.permissions?.admin)}
        >
          Add Target
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex text-12 font-normal text-ltxt border-b pb-3 gap-4">
          <div className="w-[23%]">Target Column</div>
          <div className="w-[23%]">Target Key</div>
          <div className="w-[12%]">Start Date</div>
          <div className="w-[12%]">Target Value</div>
          <div className="w-[10%]">Status</div>
          <div className="w-[20%]">Action</div>
        </div>
        {filteredTargets.map((t, i) => (
          // The index 'i' here is relative to the filtered list, which might be incorrect for handleValueChange
          // Use the index from the original 'targets' list to ensure correct state updates
          <div
            key={`${t.Target_Key}-${t.Start_Date}`}
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
                min="0"
                onChange={e => {
                    const originalIndex = targets.findIndex(origT => origT.Target_Key === t.Target_Key && origT.Start_Date === t.Start_Date);
                    if (originalIndex !== -1) {
                        handleValueChange(originalIndex, Number(e.target.value));
                    }
                }}
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