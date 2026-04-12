import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  TrashIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  getGeneratedReports,
  removeGeneratedReport,
} from '../utils/reportsHistory';

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

const Reports = () => {
  const navigate = useNavigate();
  const { isTrainer, isAdmin } = useAuth();
  const [items, setItems] = useState(() => getGeneratedReports());

  const refresh = useCallback(() => {
    setItems(getGeneratedReports());
  }, []);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener('learndash:reports-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('learndash:reports-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refresh]);

  const handleRemove = (id) => {
    if (!window.confirm('Remove this report from the list?')) return;
    removeGeneratedReport(id);
    refresh();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Open the <strong>Generated reports</strong> table below to review past runs. Use{' '}
            <strong>View</strong> for the full table and CSV/JSON export (saved in this browser).
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            type="button"
            onClick={() => navigate('/reports/generate')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Generate report
          </button>
        )}
      </div>

      <div className="card mb-8">
        <div className="card-header flex items-center gap-2">
          <DocumentTextIcon className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Generated reports</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Successful attendance and performance runs are listed here (stored in this browser).
            </p>
          </div>
        </div>
        <div className="card-body p-0">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              No reports yet. {(isAdmin() || isTrainer()) && (
                <>
                  Use <span className="font-medium text-gray-700">Generate report</span> to create
                  an attendance or performance report — it will appear here when generation succeeds.
                </>
              )}
              {!(isAdmin() || isTrainer()) && 'Ask an administrator to share exports if needed.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="table-header bg-gray-50">
                  <tr>
                    <th className="table-header-cell text-left">Generated</th>
                    <th className="table-header-cell text-left">Type</th>
                    <th className="table-header-cell text-left">Report</th>
                    <th className="table-header-cell text-left">Period</th>
                    <th className="table-header-cell text-right">Records</th>
                    <th className="table-header-cell text-right w-24">View</th>
                    <th className="table-header-cell w-12" aria-label="Remove" />
                  </tr>
                </thead>
                <tbody className="table-body divide-y divide-gray-100">
                  {items.map((row) => (
                    <tr key={row.id} className="table-row hover:bg-gray-50/80">
                      <td className="table-cell whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-gray-400 shrink-0" />
                          {formatWhen(row.createdAt)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            row.kind === 'attendance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {row.kind === 'attendance' ? (
                            <AcademicCapIcon className="h-3.5 w-3.5" />
                          ) : (
                            <ChartBarIcon className="h-3.5 w-3.5" />
                          )}
                          {row.kind}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-900 max-w-md">
                        <div className="font-medium">{row.title}</div>
                        {row.courseName && (
                          <div className="text-xs text-gray-500 mt-0.5">{row.courseName}</div>
                        )}
                        {row.userName && (
                          <div className="text-xs text-gray-500">Student: {row.userName}</div>
                        )}
                      </td>
                      <td className="table-cell text-sm text-gray-600 whitespace-nowrap">
                        {formatPeriod(row.period)}
                      </td>
                      <td className="table-cell text-sm text-gray-900 text-right tabular-nums">
                        {row.summary?.totalRecords != null ? row.summary.totalRecords : '—'}
                      </td>
                      <td className="table-cell text-right">
                        {(isAdmin() || isTrainer()) && (
                          <Link
                            to={`/reports/view/${row.id}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Link>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(row.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Remove from list"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(isAdmin() || isTrainer()) && (
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">
              Use <strong>Generate report</strong> to build attendance or performance exports. Each
              successful run is added to the table above so you can see what has been generated in
              this browser session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
