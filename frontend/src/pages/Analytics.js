import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import {
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const formatWhen = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

const formatPeriod = (period) => {
  if (!period?.start && !period?.end) return '—';
  try {
    const s = period.start ? new Date(period.start).toLocaleDateString() : '';
    const e = period.end ? new Date(period.end).toLocaleDateString() : '';
    return s && e ? `${s} – ${e}` : s || e;
  } catch {
    return '—';
  }
};

const typeBadge = (type) => {
  const map = {
    performance: 'bg-blue-100 text-blue-800',
    attendance: 'bg-amber-100 text-amber-800',
    engagement: 'bg-purple-100 text-purple-800',
    progress: 'bg-green-100 text-green-800',
  };
  return map[type] || 'bg-gray-100 text-gray-800';
};

const Analytics = () => {
  const navigate = useNavigate();
  const { isTrainer, isAdmin, isStudent } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, error, refetch } = useQuery(
    ['analytics-records', typeFilter],
    () =>
      analyticsService.getAnalyticsRecords({
        ...(typeFilter ? { type: typeFilter } : {}),
        limit: 200,
      }),
    { staleTime: 30 * 1000 }
  );

  const rows = data?.data?.data?.analytics ?? [];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isStudent()
              ? 'Analytics generated for you appear below. Open a row to see full details.'
              : 'Saved analytics records for your scope (all courses for admins, your courses for trainers). Students see only their own.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm"
          >
            Refresh
          </button>
          {(isAdmin() || isTrainer()) && (
            <button
              type="button"
              onClick={() => navigate('/analytics/entry')}
              className="btn btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Enter Analytics Data
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">Saved analytics</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Each row is one generated report for a student in a course.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400 hidden sm:block" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input text-sm py-2 max-w-xs"
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              <option value="performance">Performance</option>
              <option value="attendance">Attendance</option>
              <option value="engagement">Engagement</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="spinner h-8 w-8" />
            </div>
          )}
          {error && (
            <div className="px-6 py-12 text-center text-red-600 text-sm">
              {error.response?.data?.message || 'Could not load analytics.'}
            </div>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No analytics yet</p>
              <p className="mt-1">
                {(isAdmin() || isTrainer()) && (
                  <>
                    Use <strong>Enter Analytics Data</strong> to generate performance, attendance,
                    engagement, or progress analytics for a student and course.
                  </>
                )}
                {isStudent() && 'Your instructors or admins will create analytics for you here.'}
              </p>
            </div>
          )}
          {!isLoading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="table-header bg-gray-50">
                  <tr>
                    <th className="table-header-cell text-left">Updated</th>
                    <th className="table-header-cell text-left">Type</th>
                    <th className="table-header-cell text-left">Student</th>
                    <th className="table-header-cell text-left">Course</th>
                    <th className="table-header-cell text-left">Period</th>
                    <th className="table-header-cell text-right w-24">View</th>
                  </tr>
                </thead>
                <tbody className="table-body divide-y divide-gray-100">
                  {rows.map((row) => {
                    const u = row.user;
                    const c = row.course;
                    const studentName = u
                      ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
                      : '—';
                    return (
                      <tr key={row._id} className="table-row hover:bg-gray-50/80">
                        <td className="table-cell whitespace-nowrap text-sm text-gray-600">
                          {formatWhen(row.updatedAt)}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadge(
                              row.type
                            )}`}
                          >
                            {row.type === 'performance' ? (
                              <ChartBarIcon className="h-3.5 w-3.5" />
                            ) : (
                              <AcademicCapIcon className="h-3.5 w-3.5" />
                            )}
                            {row.type}
                          </span>
                        </td>
                        <td className="table-cell text-sm text-gray-900">
                          <span className="font-medium">{studentName}</span>
                          {u?.email && (
                            <div className="text-xs text-gray-500">{u.email}</div>
                          )}
                        </td>
                        <td className="table-cell text-sm text-gray-900">
                          <div className="flex items-start gap-1">
                            <BookOpenIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                            <span>
                              {c?.title || '—'}
                              {c?.code && (
                                <span className="text-gray-500 text-xs block">{c.code}</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-sm text-gray-600 whitespace-nowrap">
                          {formatPeriod(row.period)}
                        </td>
                        <td className="table-cell text-right">
                          <Link
                            to={`/analytics/view/${row._id}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
