'use client';
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/usercontext";
import { useInfluencerReview } from "@/hooks/influencerReviewContext";
import InfluencerModal from "@/components/Influencer/Influencer-modal";
import InfluencerTable, { InfluencerTableRow } from "@/components/Influencer/InfluencerTable";
import { Button } from "@/components/custom-ui/button";
import { getProfilesList } from '@/lib/user/user';
import { printInfluencers } from '@/lib/Influencer/Influencer';

function InfluencerPage() {
    const { user } = useUser();
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<InfluencerTableRow | null>(null);
    const [influencerOptions, setInfluencerOptions] = useState<{ label: string; value: string }[]>([]);
    // Maintain separate states for In Review and current tab
    const [currentTabData, setCurrentTabData] = useState<InfluencerTableRow[]>([]);
    const [inReviewData, setInReviewData] = useState<InfluencerTableRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Ref to track if In Review data has been fetched
    const inReviewFetched = useRef(false);

    // Get dropdown values from user context
    const statusOptions = (user?.dropdowns?.inf_status || []).map((s: string) => ({ label: s, value: s }));
    const colabOptions = (user?.dropdowns?.colab_type || []).map((c: string) => ({ label: c, value: c }));
    const productStatusOptions = (user?.dropdowns?.product_status || []).map((p: string) => ({ label: p, value: p }));

    // State for top button selection
    const [topStatus, setTopStatus] = useState('Working');
    const topButtons = ['Working','Re-Edit', 'In Review', 'Approved'];

    // Workflow status mapping
    const workflowStatusMap: { [key: string]: string } = {
        'Working': 'working',
        'Re-Edit': 'in_reedit',
        'In Review': 'in_review',
        'Approved': 'approved'
    };

    // Function to fetch data for a specific workflow status
    const fetchDataForStatus = async (status: string) => {
        try {
            const apiWorkflowStatus = workflowStatusMap[status];
            const result = await printInfluencers({ page: 1, limit: 50, workflow_status: apiWorkflowStatus });
            return (result.influencers || []).map((inf: any) => ({
                ...inf,
                post_due_date: inf.post_due_date ?? ''
            }));
        } catch (err: any) {
            console.error(`Failed to fetch ${status} data:`, err);
            throw err;
        }
    };

    // Function to fetch initial data
    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load influencer options if needed
            if (influencerOptions.length === 0) {
                const response = await getProfilesList();
                const profiles = response.profiles || [];
                const filtered = profiles.filter((profile: any) => Array.isArray(profile.tag) && profile.tag.includes('Influencer'));
                setInfluencerOptions(filtered.map((profile: any) => ({ label: profile.name, value: profile.s_no.toString() })));
            }

            // Fetch In Review data only if not already fetched
            if (!inReviewFetched.current) {
                const inReviewResult = await fetchDataForStatus('In Review');
                setInReviewData(inReviewResult);
                inReviewFetched.current = true;
            }

            // Fetch initial Working tab data
            const initialTabResult = await fetchDataForStatus('Working');
            setCurrentTabData(initialTabResult);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch current tab data
    const fetchTabData = async (status: string) => {
        // Don't fetch for In Review tab as it's managed separately
        if (status === 'In Review') {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchDataForStatus(status);
            setCurrentTabData(result);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const { setHasInReviewItems } = useInfluencerReview();

    // Update hasInReviewItems whenever inReviewData changes
    useEffect(() => {
        setHasInReviewItems(inReviewData.length > 0);
    }, [inReviewData, setHasInReviewItems]);

    // Initial data fetch on mount
    useEffect(() => {
        fetchInitialData();
    }, []); // Empty dependency array for initial load only

    // Fetch data when tab changes (except for In Review)
    useEffect(() => {
        if (topStatus !== 'In Review') {
            fetchTabData(topStatus);
        }
    }, [topStatus]);

    // Function to reset In Review fetch status
    const resetInReviewFetchStatus = () => {
        inReviewFetched.current = false;
    };

    const handleCreateInfluencer = async (data: any, action: 'create' | 'update' | 'delete' = 'create') => {
        setModalOpen(false);
        setEditData(null);

        // New workflow status is expected to be the API string (e.g. 'in_review', 'approved', 'working')
        const newStatus = data.workflow_status || 'working';
        const currentStatus = workflowStatusMap[topStatus];

        // If In Review involvement happened, clear the fetched guard so next read will refresh
        if (newStatus === 'in_review' || currentStatus === 'in_review') {
            resetInReviewFetchStatus();
        }

        // Remove the item from any in-memory lists we currently hold to avoid duplicates
        setInReviewData(prev => prev.filter(item => item.s_no !== data.s_no));
        setCurrentTabData(prev => prev.filter(item => item.s_no !== data.s_no));

        // If deleting, we're done after removal
        if (action === 'delete') {
            console.log("State updated (delete):", { action, itemId: data.s_no, currentTab: topStatus });
            return;
        }

        // Helper to add or update an item in a list
        const addOrUpdate = (prev: InfluencerTableRow[], incoming: any) => {
            const existingIndex = prev.findIndex(item => item.s_no === incoming.s_no);
            const newArray = [...prev];
            const toInsert = { ...incoming, workflow_status: newStatus } as InfluencerTableRow;
            if (existingIndex !== -1) {
                newArray[existingIndex] = { ...newArray[existingIndex], ...toInsert };
            } else {
                newArray.push(toInsert);
            }
            return newArray.sort((a, b) => (a.s_no || 0) - (b.s_no || 0));
        };

        // Place the updated item into the appropriate in-memory list only if we currently hold that list.
        if (newStatus === 'in_review') {
            setInReviewData(prev => addOrUpdate(prev, data));
        } else if (newStatus === workflowStatusMap[topStatus]) {
            // If the item moved into the currently-visible tab, update the current tab state
            setCurrentTabData(prev => addOrUpdate(prev, data));
        }

        // Note: other tabs (Working/Re-Edit/Approved when not currently loaded) will be fetched fresh on visit.
        console.log("State updated:", { action, newStatus, itemId: data.s_no, currentTab: topStatus, updatedData: data });
    };

    const handleEditInfluencer = (row: InfluencerTableRow) => {
        setEditData(row);
        setModalOpen(true);
    };

    // Get current tab's data
    const getCurrentTabData = () => {
        return topStatus === 'In Review' ? inReviewData : currentTabData;
    };

    return (
        <div className="min-h-screen h-screen flex flex-col bg-themeBase-l1">
            {/* Top Bar */}
            <div className="bg-themeBase border-b border-themeBase-l2 px-6 py-4 flex items-center justify-between">
                {/* Left Section: Three Status Buttons */}
                <div className="flex gap-x10">
                    {topButtons.map(btn => (
                        <Button
                            key={btn}
                            onClick={() => setTopStatus(btn)} // This will trigger the fetch via useEffect
                            variant="outline"
                            size="m"
                            className={topStatus === btn ? '!bg-newsecondary !text-themeBase' : ''}
                        >
                            {btn}
                        </Button>
                    ))}
                </div>
                {/* Right Section: Add Button */}
                <div>
                    <Button variant="primary" onClick={() => { setModalOpen(true); setEditData(null); }}>
                        + Add Influencer
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 p-4">
                {loading ? (
                  <div className="bg-white rounded-lg shadow-sm p-4 h-full flex items-center justify-center">
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading influencers...</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm h-full flex flex-col w-full max-w-none overflow-hidden">
                    {/* Header with Table Title */}
                    <div className="p-3 border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">
                                    Influencer List
                                </h2>
                            </div>
                        </div>
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                    {/* Table Container */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <InfluencerTable
                            influencers={getCurrentTabData()}
                            loading={false}
                            error={error}
                            onEdit={handleEditInfluencer}
                            currentTab={topStatus}
                        />
                    </div>
                  </div>
                )}
            </div>
            {/* Modal */}
            {modalOpen && (
                <InfluencerModal
                    isOpen={modalOpen}
                    onClose={() => { setModalOpen(false); setEditData(null); }}
                    onCreate={handleCreateInfluencer}
                    influencerOptions={influencerOptions}
                    statusOptions={statusOptions}
                    colabOptions={colabOptions}
                    productStatusOptions={productStatusOptions}
                    editData={editData}
                    currentTab={topStatus}
                    isCreator={Array.isArray(user?.permissions?.influencer) && user.permissions.influencer.includes('creator')}
                />
            )}
        </div>
    );
}

export default InfluencerPage;