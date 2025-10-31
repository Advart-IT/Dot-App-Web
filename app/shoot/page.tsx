'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from "@/components/custom-ui/dropdown2";
import { useUser } from '@/hooks/usercontext';
import ShootModal from '@/components/shoot/Shoot';
import ShootTable from '@/components/shoot/ShootTable';
import { printShoots, printShootTargets, ShootResponse, ShootPrintResponse, ShootTargetBrandResult } from '@/lib/shoot/shoot-api';
import AppModal from '@/components/custom-ui/AppModal';

export default function ShootPage() {
  // Remove old delete modal state
  const { user } = useUser();
  const reportrixBrands: string[] = user?.permissions?.reportrix ? Object.keys(user.permissions.reportrix) : [];
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingShoot, setEditingShoot] = useState<ShootResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shoots, setShoots] = useState<ShootResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [shootData, setShootData] = useState<ShootPrintResponse | null>(null);
  const [targets, setTargets] = useState<ShootTargetBrandResult[] | null>(null);
  const [targetsLoading, setTargetsLoading] = useState<boolean>(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  // Initialize month and year to current date
  useEffect(() => {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const currentYear = now.getFullYear().toString();
    
    if (!selectedMonth) setSelectedMonth(currentMonth);
    if (!selectedYear) setSelectedYear(currentYear);
  }, [selectedMonth, selectedYear]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const months = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ];
    return months;
  }, []);

  // Generate year options (last 5 years to next 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 2; year++) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  }, []);

  // Function to get start and end dates of selected month/year
  const getMonthDateRange = (month: string, year: string) => {
    const monthNum = parseInt(month, 10); // 1-12
    const yearNum = parseInt(year, 10);
    if (!month || isNaN(monthNum) || !year || isNaN(yearNum)) {
      const now = new Date();
      const safeMonth = now.getMonth() + 1;
      const safeYear = now.getFullYear();
      const startDate = `${safeYear}-${safeMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(safeYear, safeMonth, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    }
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };


  // Fetch shoots and targets data
  const fetchShootsAndTargets = async () => {
    if (!selectedMonth || !selectedYear) return;
    setLoading(true);
    setTargetsLoading(true);
    setError(null);
    setTargetsError(null);
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      // Fetch shoots
      const shootsResponse = await printShoots({
        date_filter: 'between',
        start_date: startDate,
        end_date: endDate,
        page: 1,
        limit: 100,
      });
      setShootData(shootsResponse);
      setShoots(shootsResponse.shoots || []);
      // Fetch targets
      const targetsResponse = await printShootTargets({
        start_date: startDate,
        end_date: endDate,
      });
      setTargets(targetsResponse.results || []);
    } catch (err) {
      console.error('Error fetching shoots/targets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shoots/targets');
      setShoots([]);
      setTargets([]);
    } finally {
      setLoading(false);
      setTargetsLoading(false);
    }
  };

  // Fetch data when month or year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchShootsAndTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const handleOpenModal = () => {
    setEditingShoot(null); // Clear edit data for new shoot
    setShowModal(true);
    setError(null);
  };

  const handleEditShoot = (shoot: ShootResponse) => {
    // Always use the latest shoot object from state (in case it was updated)
    const latest = shoots.find(s => s.id === shoot.id) || shoot;
    console.log('[handleEditShoot] Opening modal for shoot id:', shoot.id, 'Latest:', latest);
    setEditingShoot(latest);
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShoot(null);
    // No fetchShootsData here; UI is updated via onCreate/onUpdate/onRequestDelete
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleDeleteShoot = (shoot: ShootResponse) => {
    // No longer needed, handled in modal
  };

  // Remove brand access check so all users can access the shoot page

  // Get current start and end date for table and target summary
  const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);

  return (
    <div className="min-h-screen flex flex-col bg-themeBase-l1">
      {/* Top Bar */}
      <div className="bg-themeBase border-b border-themeBase-l2 px-6 py-4 flex items-center justify-between">
        {/* Left Section: Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Shoot Management</h1>
        </div>

        {/* Right Section: Date Pickers */}
        <div className="flex items-center space-x-4">
          {/* Month Picker */}
          <div className="w-[120px]">
            <SmartDropdown
              options={monthOptions}
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(Array.isArray(val) ? val[0] : val)}
              placeholder="Month"
              className="w-full"
            />
          </div>
          
          {/* Year Picker */}
          <div className="w-[100px]">
            <SmartDropdown
              options={yearOptions}
              value={selectedYear}
              onChange={(val) => setSelectedYear(Array.isArray(val) ? val[0] : val)}
              placeholder="Year"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 p-4">
        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col w-full max-w-none">
          {/* Header with Add Button and Summary */}
          <div className="p-3 border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Shoots for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </h2>
              </div>
              <Button
                onClick={handleOpenModal}
                variant="primary"
                size="m"
              >
                + Add Shoot
              </Button>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
          
          {/* Table Container */}
          <div className="flex-1 min-h-screen h-screen overflow-hidden">
            <ShootTable 
              shoots={shoots} 
              loading={loading} 
              error={error}
              onEdit={handleEditShoot}
              onDelete={handleDeleteShoot}
              startDate={startDate}
              endDate={endDate}
              targetsFromParent={targets}
            />
          </div>
        </div>
      </div>
    {/* Shoot Modal */}
    <ShootModal
      isOpen={showModal}
      onClose={handleCloseModal}
      onError={handleError}
      editData={editingShoot}
      reportrixBrands={reportrixBrands}
      onCreate={(response) => {
        // Add new shoot (ensure all fields are present)
        setShoots(prev => [response, ...prev]);
        setShootData(prev => ({
          ...prev,
          shoots: [response, ...(prev?.shoots || [])],
        }));
        // Update the relevant brand's target in the summary using the response (case-insensitive)
        if (response.target_summary && Array.isArray(response.target_summary)) {
          setTargets(prevTargets => {
            if (!prevTargets) return response.target_summary;
            const updated = [...prevTargets];
            response.target_summary.forEach((newTarget: import('@/lib/shoot/shoot-api').ShootTargetBrandResult) => {
              const idx = updated.findIndex(t => t.brand?.toLowerCase() === newTarget.brand?.toLowerCase());
              if (idx !== -1) updated[idx] = newTarget;
              else updated.push(newTarget);
            });
            return updated;
          });
        } else if (response.target) {
          setTargets(prevTargets => {
            if (!prevTargets) return [response.target];
            const updated = [...prevTargets];
            const idx = updated.findIndex(t => t.brand?.toLowerCase() === response.target.brand?.toLowerCase());
            if (idx !== -1) updated[idx] = response.target;
            else updated.push(response.target);
            return updated;
          });
        }
        setShowModal(false);
        setEditingShoot(null);
      }}
      onUpdate={(response) => {
        console.log('[onUpdate] API response:', response);
        // Use s_no for id, merge updated_fields into previous shoot object
        setShoots(prev => {
          const updated = prev.map(s => {
            if (s.id === response.s_no) {
              let merged = { ...s, ...response.updated_fields };
              // Deep merge shoot_charges if present
              if (response.updated_fields && response.updated_fields.shoot_charges) {
                merged.shoot_charges = {
                  ...s.shoot_charges,
                  ...response.updated_fields.shoot_charges,
                  models: {
                    ...(s.shoot_charges?.models || {}),
                    ...(response.updated_fields.shoot_charges.models || {})
                  }
                };
              }
              // If the API also returns other top-level fields (like target), merge them too
              Object.keys(response).forEach(key => {
                if (key !== 'updated_fields' && key !== 's_no') {
                  merged[key] = response[key];
                }
              });
              console.log('[onUpdate] Merged shoot:', merged);
              return merged;
            }
            return s;
          });
          console.log('[onUpdate] Updated shoots array:', updated);
          return updated;
        });
        setShootData(prev => ({
          ...prev,
          shoots: prev?.shoots?.map(s => {
            if (s.id === response.s_no) {
              let merged = { ...s, ...response.updated_fields };
              if (response.updated_fields && response.updated_fields.shoot_charges) {
                merged.shoot_charges = {
                  ...s.shoot_charges,
                  ...response.updated_fields.shoot_charges,
                  models: {
                    ...(s.shoot_charges?.models || {}),
                    ...(response.updated_fields.shoot_charges.models || {})
                  }
                };
              }
              Object.keys(response).forEach(key => {
                if (key !== 'updated_fields' && key !== 's_no') {
                  merged[key] = response[key];
                }
              });
              return merged;
            }
            return s;
          }) || [],
        }));
        // Update the relevant brand's target in the summary using the response (case-insensitive)
        if (response.target_summary && Array.isArray(response.target_summary)) {
          setTargets(prevTargets => {
            if (!prevTargets) return response.target_summary;
            const updated = [...prevTargets];
            response.target_summary.forEach((newTarget: import('@/lib/shoot/shoot-api').ShootTargetBrandResult) => {
              const idx = updated.findIndex(t => t.brand?.toLowerCase() === newTarget.brand?.toLowerCase());
              if (idx !== -1) updated[idx] = newTarget;
              else updated.push(newTarget);
            });
            console.log('[onUpdate] Updated targets array (target_summary):', updated);
            return updated;
          });
        } else if (response.target) {
          setTargets(prevTargets => {
            if (!prevTargets) return [response.target];
            const updated = [...prevTargets];
            const idx = updated.findIndex(t => t.brand?.toLowerCase() === response.target.brand?.toLowerCase());
            if (idx !== -1) updated[idx] = response.target;
            else updated.push(response.target);
            console.log('[onUpdate] Updated targets array (target):', updated);
            return updated;
          });
        }
        setShowModal(false);
        setEditingShoot(null);
      }}
      onRequestDelete={(response) => {
        if (response.s_no) {
          setShoots(prev => prev.filter(s => s.id !== response.s_no));
          setShootData(prev => ({
            ...prev,
            shoots: prev?.shoots?.filter(s => s.id !== response.s_no) || [],
          }));
        }
        // Update the relevant brand's target in the summary using the response (case-insensitive)
        if (response.target_summary && Array.isArray(response.target_summary)) {
          setTargets(prevTargets => {
            if (!prevTargets) return response.target_summary;
            const updated = [...prevTargets];
            response.target_summary.forEach((newTarget: import('@/lib/shoot/shoot-api').ShootTargetBrandResult) => {
              const idx = updated.findIndex(t => t.brand?.toLowerCase() === newTarget.brand?.toLowerCase());
              if (idx !== -1) updated[idx] = newTarget;
              else updated.push(newTarget);
            });
            return updated;
          });
        } else if (response.target) {
          setTargets(prevTargets => {
            if (!prevTargets) return [response.target];
            const updated = [...prevTargets];
            const idx = updated.findIndex(t => t.brand?.toLowerCase() === response.target.brand?.toLowerCase());
            if (idx !== -1) updated[idx] = response.target;
            else updated.push(response.target);
            return updated;
          });
        }
        setShowModal(false);
        setEditingShoot(null);
      }}
    />
    {/* Custom Delete Confirmation Modal removed, handled in ShootModal */}
    </div>
  );
}