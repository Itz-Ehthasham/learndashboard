import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            View detailed analytics and insights.
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            onClick={() => navigate('/analytics/entry')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Enter Analytics Data
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Comprehensive analytics page will be implemented with:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Performance metrics and trends</li>
            <li>Attendance tracking and reports</li>
            <li>Student engagement analytics</li>
            <li>Course completion rates</li>
            <li>Comparative analysis tools</li>
            <li>Custom date range filtering</li>
            <li>Export capabilities for reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
