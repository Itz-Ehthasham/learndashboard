import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate and download comprehensive reports.
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            onClick={() => navigate('/reports/generate')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Reports Center</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Reports page will be implemented with:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Performance reports generation</li>
            <li>Attendance reports</li>
            <li>Course analytics reports</li>
            <li>Student progress reports</li>
            <li>Custom date range reports</li>
            <li>Export to PDF and CSV formats</li>
            <li>Scheduled report generation</li>
            <li>Report templates and customization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
