import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getGeneratedReportById } from '../utils/reportsHistory';
import GeneratedReportDisplay from '../components/GeneratedReportDisplay';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStudent } = useAuth();
  const record = getGeneratedReportById(id);

  if (isStudent()) {
    return <Navigate to="/reports" replace />;
  }

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Reports
        </button>
        <div className="card">
          <div className="card-body text-center py-12 text-gray-600">
            <p className="font-medium text-gray-900">Report not found</p>
            <p className="mt-2 text-sm">
              It may have been removed from this browser’s list, or the link is invalid. Generated
              reports are stored only in this browser (local storage).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasSnapshot = record.snapshot && typeof record.snapshot === 'object';

  return (
    <div className="max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/reports')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Reports
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{record.title}</h1>
        <p className="mt-1 text-sm text-gray-500 capitalize">
          {record.kind} · saved {record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}
        </p>
      </div>

      {!hasSnapshot ? (
        <div className="card">
          <div className="card-body text-sm text-gray-600">
            <p className="font-medium text-gray-900">Preview not available</p>
            <p className="mt-2">
              This entry was saved before full report data was stored. Generate the report again from{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => navigate('/reports/generate')}
              >
                Generate report
              </button>{' '}
              to capture a viewable snapshot on this page next time.
            </p>
          </div>
        </div>
      ) : (
        <GeneratedReportDisplay
          reportData={record.snapshot}
          filePrefix={`${record.kind}-${record.id?.slice(0, 8) || 'export'}`}
        />
      )}
    </div>
  );
};

export default ReportView;
