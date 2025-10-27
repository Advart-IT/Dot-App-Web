'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

export interface InfluencerTableRow {
  post_due_date: any;
  s_no: number;
  influencer_id?: number;
  influencer_name?: string;
  status?: string;
  workflow_status?: string;
  deliverable_details?: string;
  details?: string;
  payment_json?: { amount: number; paid: boolean };
  colab_type?: string;
  product_details?: string[];
  concept?: string;
  size?: string;
  contract_link?: string;
  product_status?: string;
  return_received?: { received: boolean; date: string | null };
  created_at?: string;
  created_by?: number;
  feedback?: string;
  performance?: {
    views?: boolean;
    comments?: boolean;
    performance?: string;
    [key: string]: any;
  };
}

interface InfluencerTableProps {
  influencers: InfluencerTableRow[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: InfluencerTableRow) => void;
  onDelete?: (row: InfluencerTableRow) => void;
  currentTab?: string;
  isReviewer?: boolean; // Add isReviewer prop
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function InfluencerTable({ 
  influencers, 
  loading = false, 
  error, 
  onEdit, 
  onDelete,
  currentTab,
  isReviewer = false // Add isReviewer prop with default value
}: InfluencerTableProps) {

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

  if (!influencers || influencers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No influencers found.</p>
        </div>
      </div>
    );
  }

const isFeedbackOrPerformanceEmpty = (row: InfluencerTableRow): boolean => {
  // Check if feedback is empty or undefined
  // const feedbackEmpty = !row.feedback || row.feedback.trim() === '';
  
  // Check if performance data is missing or empty
  const performanceEmpty = !row.performance?.performance || row.performance.performance.trim() === '';
  
  // Check if workflow status is approved (case insensitive)
  const isApproved = row.workflow_status?.toLowerCase() === 'approved';
  
  // Return true only if it's approved AND either feedback or performance is empty
  return isApproved && performanceEmpty;
};



  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm p-3 overflow-x-auto">
      <table className="min-w-[1400px] divide-y divide-gray-200 border-l-transparent">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Brand</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Colab Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Concept</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contract Link</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Post Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product Details</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product Status</th>
            {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Paid Status</th> */}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Received Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Size</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {influencers.map((row) => {
            // Paid status logic
            let paid = false;
            let amount = 0;
            if (row.payment_json) {
              paid = !!row.payment_json.paid;
              amount = typeof row.payment_json.amount === 'number' ? row.payment_json.amount : 0;
            }
            // Received status logic
            const received = row.return_received?.received === true;
            
            // Check if row should show red border
            const shouldShowRedBorder = isReviewer && isFeedbackOrPerformanceEmpty(row);

            return (
             <tr
                key={row.s_no}
                onClick={() => onEdit?.(row)}
                className= {`${isFeedbackOrPerformanceEmpty(row) ? "bg-red-50/40" : ""}`}
              >

                <td
                  className={`px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900 ${isFeedbackOrPerformanceEmpty(row) ? "border-l-2 border-red-500" : "border-l-4 border-transparent"}`}
                  title={row.influencer_name ?? ''}
                >
                  {row.influencer_name ?? '-'}
                </td>
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={(row as any).brad ?? ''}>{(row as any).brad ?? '-'}</td>
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.colab_type ?? ''}>{row.colab_type ?? '-'}</td>
                <td className="px-4 py-4 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.concept ?? ''}>{row.concept ?? '-'}</td>
                <td className="px-4 py-4 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-blue-700" title={row.contract_link ?? ''}>
                  {row.contract_link ? (
                    <a href={row.contract_link} target="_blank" rel="noopener noreferrer">{row.contract_link}</a>
                  ) : '-'}
                </td>
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.post_due_date ? formatDate(row.post_due_date) : ''}>{row.post_due_date ? formatDate(row.post_due_date) : '-'}</td>
                <td className="px-4 py-4 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.product_details && row.product_details.length > 0 ? row.product_details.join(', ') : ''}>
                  {row.product_details && row.product_details.length > 0 ? row.product_details.join(', ') : '-'}
                </td>
                {/* Product Status */}
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.product_status ?? ''}>{row.product_status ?? '-'}</td>
                {/* Paid Status */}
                {/* <td className="px-4 py-4 max-w-[160px] whitespace-nowrap text-sm">
                  <span className="font-semibold mr-2">₹{amount}</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${paid ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td> */}
                {/* Received Status */}
                <td className="px-4 py-4 max-w-[180px] whitespace-nowrap text-sm">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${received ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                    title={row.return_received?.date ? formatDate(row.return_received.date) : ''}
                  >
                    {received ? 'Received' : 'Not Received'}
                  </span>
                  {row.return_received?.date && (
                    <span className="ml-2 text-xs text-gray-700">{formatDate(row.return_received.date)}</span>
                  )}
                </td>
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.size ?? ''}>{row.size ?? '-'}</td>
                <td className="px-4 py-4 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900" title={row.status ?? ''}>{row.status ?? '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}