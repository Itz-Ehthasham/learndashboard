import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { courseService, attendanceService } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

function localDateInputValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function instructorId(course) {
  const ins = course?.instructor;
  if (!ins) return null;
  return typeof ins === 'object' ? ins._id : ins;
}

const DailyAttendance = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(localDateInputValue);
  const [rows, setRows] = useState([]);

  const { data: coursesResp, isLoading: coursesLoading } = useQuery(
    'courses-attendance',
    () => courseService.getCourses({ limit: 500 })
  );

  const courses = coursesResp?.data?.data?.courses ?? [];
  const myCourses = useMemo(() => {
    if (isAdmin()) return courses;
    const uid = user?.id || user?._id;
    if (!uid) return [];
    return courses.filter((c) => String(instructorId(c)) === String(uid));
  }, [courses, user, isAdmin]);

  useEffect(() => {
    if (courseId || myCourses.length === 0) return;
    setCourseId(myCourses[0]._id);
  }, [myCourses, courseId]);

  const { data: dayResp, isLoading: dayLoading } = useQuery(
    ['attendanceDay', courseId, date],
    () => attendanceService.getAttendanceDay(courseId, date).then((r) => r.data),
    { enabled: Boolean(courseId && date) }
  );

  useEffect(() => {
    const list = dayResp?.data?.students;
    if (!list) return;
    setRows(
      list.map((s) => ({
        studentId: s.student._id,
        status: s.status,
      }))
    );
  }, [dayResp]);

  const saveMutation = useMutation(
    (payload) => attendanceService.saveAttendanceDayBulk(payload),
    {
      onSuccess: () => {
        toast.success('Attendance saved');
        queryClient.invalidateQueries(['attendanceDay', courseId, date]);
        queryClient.invalidateQueries('students');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
    }
  );

  const students = dayResp?.data?.students ?? [];
  const courseMeta = dayResp?.data?.course;

  const statusById = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.studentId, r.status])),
    [rows]
  );

  const handleStatusChange = (studentId, status) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.studentId !== studentId);
      next.push({ studentId, status });
      return next;
    });
  };

  const handleSave = () => {
    if (!courseId) {
      toast.error('Select a course');
      return;
    }
    if (rows.length === 0) {
      toast.error('No enrolled students for this course');
      return;
    }
    saveMutation.mutate({
      courseId,
      date,
      entries: rows.map((r) => ({ studentId: r.studentId, status: r.status })),
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/students')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to students
      </button>

      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100">
          <CalendarDaysIcon className="h-8 w-8 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily attendance</h1>
          <p className="mt-1 text-sm text-gray-600">
            Mark each student for the selected class day. Totals on the student list update from these
            records.
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="form-label">Course</label>
            <select
              className="form-input"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesLoading || myCourses.length === 0}
            >
              {myCourses.length === 0 ? (
                <option value="">No courses available</option>
              ) : (
                myCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.title}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saveMutation.isLoading || !courseId || students.length === 0}
          >
            {saveMutation.isLoading ? 'Saving…' : 'Save attendance'}
          </button>
        </div>
      </div>

      {courseMeta && (
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium text-gray-800">
            {courseMeta.code} — {courseMeta.title}
          </span>{' '}
          · {date}
        </p>
      )}

      <div className="card">
        <div className="card-body p-0">
          {dayLoading ? (
            <div className="flex justify-center py-16">
              <div className="spinner h-8 w-8" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm px-4">
              No active students enrolled in this course for this day. Enroll students on the course
              first.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">ID</th>
                    <th className="table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {students.map((row) => {
                    const id = row.student._id;
                    const status = statusById[id] ?? row.status;
                    return (
                      <tr key={id} className="table-row">
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">
                            {row.student.firstName} {row.student.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{row.student.email}</div>
                        </td>
                        <td className="table-cell text-sm">{row.student.studentId || '—'}</td>
                        <td className="table-cell">
                          <select
                            className="form-input max-w-xs"
                            value={status}
                            onChange={(e) => handleStatusChange(id, e.target.value)}
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                            <option value="absent">Absent</option>
                          </select>
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

export default DailyAttendance;
