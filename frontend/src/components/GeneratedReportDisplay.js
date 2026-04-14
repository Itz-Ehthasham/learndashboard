import React from 'react';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export function normalizeReportRows(report) {
  if (report == null) return [];
  if (Array.isArray(report)) return report;
  return [report];
}

export function exportReportToCSV(data, filename) {
  const rows = normalizeReportRows(data?.report);
  if (!rows.length) return false;
  const safeName = String(filename || 'report').replace(/[/\\?%*:|"<>]/g, '-');
  const csvContent = [
    Object.keys(rows[0] || {}).join(','),
    ...rows.map((row) =>
      Object.values(row)
        .map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v))
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  return true;
}

export function exportReportToJSON(data, filename) {
  if (!data) return false;
  const safeName = String(filename || 'report').replace(/[/\\?%*:|"<>]/g, '-');
  const jsonContent = JSON.stringify(
    { report: data.report, period: data.period, generatedAt: data.generatedAt },
    null,
    2
  );
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
  return true;
}

export default function GeneratedReportDisplay({ reportData, filePrefix = 'report' }) {
  if (!reportData) return null;

  return (
    <div className="card mt-8">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Report Results
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => exportReportToCSV(reportData, `${filePrefix}`)}
            className="btn btn-secondary btn-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportReportToJSON(reportData, `${filePrefix}`)}
            className="btn btn-secondary btn-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Records</p>
              <p className="text-2xl font-bold text-blue-900">
                {reportData.summary?.totalRecords || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Average Score</p>
              <p className="text-2xl font-bold text-green-900">
                {(() => {
                  const n = Number(reportData.summary?.averageScore);
                  return Number.isFinite(n) ? n.toFixed(1) : 'N/A';
                })()}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Pass Rate</p>
              <p className="text-2xl font-bold text-yellow-900">
                {(() => {
                  const n = Number(reportData.summary?.passRate);
                  return Number.isFinite(n) ? `${n.toFixed(1)}%` : 'N/A';
                })()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-900">
                {(() => {
                  const n = Number(reportData.summary?.completionRate);
                  return Number.isFinite(n) ? `${n.toFixed(1)}%` : 'N/A';
                })()}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Data</h4>
          <div className="table-responsive max-h-96 overflow-y-auto">
            <table className="table">
              <thead className="table-header sticky top-0">
                <tr>
                  {normalizeReportRows(reportData.report)[0] &&
                    Object.keys(normalizeReportRows(reportData.report)[0]).map((key) => (
                      <th key={key} className="table-header-cell">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {normalizeReportRows(reportData.report)
                  .slice(0, 50)
                  .map((row, index) => (
                    <tr key={index} className="table-row">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="table-cell">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {normalizeReportRows(reportData.report).length > 50 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing first 50 of {normalizeReportRows(reportData.report).length} records. Export to
              see all data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
