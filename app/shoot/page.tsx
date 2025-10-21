'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from "@/components/custom-ui/dropdown2";
import { useUser } from '@/hooks/usercontext';
import ShootModal from '@/components/shoot/Shoot';
import ShootTable from '@/components/shoot/ShootTable';
import { printShoots, ShootResponse, ShootPrintResponse, deleteShoot } from '@/lib/shoot/shoot-api';

export default function ShootPage() {
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

  // Fetch shoots data
  const fetchShootsData = async () => {
    if (!selectedMonth || !selectedYear) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      
      const response = await printShoots({
        date_filter: 'between',
        start_date: startDate,
        end_date: endDate,
        // Remove brand filter to get all data
        page: 1,
        limit: 100,
      });
      
      setShootData(response);
      setShoots(response.shoots || []);
    } catch (err) {
      console.error('Error fetching shoots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shoots');
      setShoots([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month or year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchShootsData();
    }
  }, [selectedMonth, selectedYear]);

  const handleOpenModal = () => {
    setEditingShoot(null); // Clear edit data for new shoot
    setShowModal(true);
    setError(null);
  };

  const handleEditShoot = (shoot: ShootResponse) => {
    setEditingShoot(shoot);
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShoot(null);
    // Refresh data when modal closes (in case new shoot was added/updated)
    if (selectedMonth && selectedYear) {
      fetchShootsData();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleDeleteShoot = async (shoot: ShootResponse) => {
    if (!confirm(`Are you sure you want to delete this shoot for ${shoot.brand} on ${shoot.date}?`)) {
      return;
    }

    try {
      await deleteShoot(shoot.id);
      // Refresh data after successful deletion
      if (selectedMonth && selectedYear) {
        fetchShootsData();
      }
    } catch (err) {
      console.error('Error deleting shoot:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete shoot');
    }
  };

  // Add this check at the top
  if (reportrixBrands.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>You don't have access to any brands. Please contact your admin.</p>
      </div>
    );
  }

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
          <div className="flex-1 min-h-0 overflow-hidden">
            <ShootTable 
              shoots={shoots} 
              loading={loading} 
              error={error}
              onEdit={handleEditShoot}
              onDelete={handleDeleteShoot}
              startDate={startDate}
              endDate={endDate}
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
      />
    </div>
  );
}