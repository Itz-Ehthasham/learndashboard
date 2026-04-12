import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { analyticsService } from '../services/api';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
};

const DataBlock = ({ title, data }) => {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return null;
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg px-4 py-3">
            <dt className="text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </dt>
            <dd className="font-medium text-gray-900 mt-1">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const AnalyticsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(
    ['analytics-record', id],
    () => analyticsService.getAnalyticsRecord(id),
    { enabled: !!id }
  );

  const record = data?.data?.data?.analytics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/analytics')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Analytics
        </button>
        <div className="card">
          <div className="card-body text-center py-12 text-gray-600">
            {error?.response?.data?.message || 'Analytics record not found or access denied.'}
          </div>
        </div>
      </div>
    );
  }

  const student = record.user;
  const course = record.course;
  const studentLabel = student
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
    : '—';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/analytics')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Analytics
      </button>

      <div className="flex items-start gap-3 mb-6">
        <ChartBarIcon className="h-10 w-10 text-blue-600 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{record.type} analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Updated {formatDate(record.updatedAt)}</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Student & course</h2>
        </div>
        <div className="card-body space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Student: </span>
            <span className="font-medium text-gray-900">{studentLabel}</span>
            {student?.email && (
              <span className="text-gray-500"> ({student.email})</span>
            )}
            {student?.role && (
              <span className="text-gray-400"> · {student.role}</span>
            )}
          </p>
          <p>
            <span className="text-gray-500">Course: </span>
            <span className="font-medium text-gray-900">
              {course?.title || '—'}
              {course?.code && ` (${course.code})`}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Period: </span>
            <span className="text-gray-900">
              {record.period?.start ? formatDate(record.period.start) : '—'} —{' '}
              {record.period?.end ? formatDate(record.period.end) : '—'}
            </span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Metrics</h2>
        </div>
        <div className="card-body">
          <DataBlock title="Data" data={record.data} />
          <DataBlock title="Comparisons" data={record.comparisons} />
          {Array.isArray(record.trends) && record.trends.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Trends</h3>
              <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                <table className="table text-sm">
                  <thead className="table-header bg-gray-50 sticky top-0">
                    <tr>
                      <th className="table-header-cell text-left">Date</th>
                      <th className="table-header-cell text-left">Metric</th>
                      <th className="table-header-cell text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.trends.map((t, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-cell">{formatDate(t.date)}</td>
                        <td className="table-cell">{t.metric}</td>
                        <td className="table-cell text-right tabular-nums">{t.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDetail;
