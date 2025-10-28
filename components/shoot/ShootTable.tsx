'use client';
import React, { useEffect, useState } from 'react';
import type { ShootResponse } from '@/lib/shoot/shoot-api';
import type { ShootTargetBrandResult } from '@/lib/shoot/shoot-api';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface ShootTableProps {
  shoots: ShootResponse[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (shoot: ShootResponse) => void;
  onDelete?: (shoot: ShootResponse) => void;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string;   // ISO date string (YYYY-MM-DD)
  targetsFromParent?: ShootTargetBrandResult[] | null;
}

// Simple target summary component
function TargetSummary({ targets }: {
  targets: ShootTargetBrandResult[] | null;
}) {
  if (!targets || targets.length === 0) {
    return <div className="mb-4 text-gray-500">No targets found for this period.</div>;
  }
  return (
    <div className="mb-4 flex flex-wrap gap-4">
      {targets.map((t) => {
        const achieved = Number(t.target_achieved);
        const target = Number(t.target);
        const percent = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
        return (
          <div key={t.brand} className="bg-white border rounded-lg shadow-sm p-3 flex-1 min-w-[220px] max-w-[320px]">
            <div className="font-semibold text-gray-700 mb-1 text-base">{t.brand}</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Achieved</span>
              <span className={`font-bold text-sm ${achieved >= target ? 'text-green-600' : 'text-orange-600'}`}>{achieved} / {target}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${achieved >= target ? 'bg-green-500' : 'bg-orange-400'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShootTable({ shoots, loading = false, error, onEdit, onDelete, startDate, endDate, targetsFromParent }: ShootTableProps) {
  // Always use targetsFromParent for summary
  const targets = targetsFromParent ?? null;

  // Calculate total of shoot_charges object
  const calculateShootChargesTotal = (shootCharges: Record<string, any> | undefined): number => {
    if (!shootCharges) return 0;
    let total = 0;
    Object.values(shootCharges).forEach(value => {
      if (Array.isArray(value) && value.length > 0 && !isNaN(Number(value[0]))) {
        total += Number(value[0]);
      } else if (typeof value === 'number') {
        total += value;
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        total += Number(value);
      }
    });
    return total;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // if (loading) {
  //   return (
  //     <div className="bg-white rounded-lg shadow-sm p-4">
  //       <div className="p-6 text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-2 text-gray-500">Loading shoots...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!shoots || shoots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* Target summary above empty table */}
        <TargetSummary targets={targets} />
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No shoots found for the selected criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden p-3">
      {/* Target summary above the table */}
      <TargetSummary targets={targets} />
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] sticky left-0 bg-gray-50 z-10">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Brand</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Photographer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Model</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Products Covered</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Total Hours</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Total Charges</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Media Assets</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shoots.map((shoot) => {
            const shootChargesTotal = calculateShootChargesTotal(shoot.shoot_charges);
            return (
              <tr
                key={shoot.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onEdit?.(shoot)}
                tabIndex={0}
                aria-label={`View shoot for ${shoot.brand} on ${formatDate(shoot.date)}`}
              >
                {/* Date */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(shoot.date)}</td>
                {/* Brand */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shoot.brand || 'N/A'}</td>
                {/* Photographer */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shoot.photographer_name || 'N/A'}</td>
                {/* Model(s) */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Array.isArray(shoot.model_names) && shoot.model_names.length > 0
                    ? `${shoot.model_names[0]}${shoot.model_names.length > 1 ? ', +' + (shoot.model_names.length - 1) : ''}`
                    : 'N/A'}
                </td>
                {/* Products Covered */}
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="max-w-[200px] truncate" title={shoot.products_covered || 'N/A'}>{shoot.products_covered || 'N/A'}</div>
                </td>
                {/* Total Hours */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shoot.total_hrs ? `${shoot.total_hrs} hrs` : 'N/A'}</td>
                {/* Total Charges */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(calculateShootChargesTotal(shoot.shoot_charges))}
                </td>
                {/* Media Assets */}
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="max-w-[150px] truncate" title={shoot.media_assest || 'N/A'}>{shoot.media_assest || 'N/A'}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}