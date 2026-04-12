import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
  XMarkIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const isStudentEnrolled = (course, userId) => {
  if (!course?.enrolledStudents || !userId) return false;
  const uid = userId.toString();
  return course.enrolledStudents.some((e) => {
    const sid = e.student?._id ?? e.student;
    return sid && sid.toString() === uid && e.status === 'active';
  });
};

const Courses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isTrainer, isAdmin, isStudent } = useAuth();
  const [modalCourse, setModalCourse] = useState(null);

  const { data: coursesData, isLoading, error } = useQuery(
    'courses',
    courseService.getCourses
  );

  const enrollMutation = useMutation(
    (courseId) => courseService.enrollInCourse(courseId),
    {
      onSuccess: (_, courseId) => {
        toast.success('You are now enrolled in this course.');
        queryClient.invalidateQueries('courses');
        setModalCourse((prev) => {
          if (!prev || prev._id !== courseId) return prev;
          return {
            ...prev,
            enrolledStudents: [
              ...(prev.enrolledStudents || []),
              { student: user?._id, status: 'active' },
            ],
          };
        });
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Could not enroll in this course.');
      },
    }
  );

  const courses = coursesData?.data?.data?.courses || [];

  const enrolledInModal = useMemo(
    () => isStudentEnrolled(modalCourse, user?._id),
    [modalCourse, user?._id]
  );

  const handleCardClick = (course) => {
    if (isStudent()) {
      setModalCourse(course);
    } else {
      navigate(`/courses/${course._id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading courses</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Browse and manage your courses.
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            type="button"
            onClick={() => navigate('/courses/create')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(course)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(course);
              }
            }}
            className={`card ${
              isStudent() ? 'cursor-pointer hover:ring-2 hover:ring-blue-200 transition-shadow' : 'cursor-pointer hover:ring-2 hover:ring-gray-200'
            }`}
          >
            <div className="card-body">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {course.description}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  {course.enrolledStudents?.length || 0} students enrolled
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {course.duration} weeks
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="badge badge-info">{course.level}</span>
                <span className="badge badge-success">{course.credits} credits</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new course.
          </p>
        </div>
      )}
      {modalCourse && isStudent() && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-modal-title"
          onClick={() => setModalCourse(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white rounded-t-xl">
              <h2 id="course-modal-title" className="text-lg font-semibold text-gray-900 pr-8">
                {modalCourse.title}
              </h2>
              <button
                type="button"
                onClick={() => setModalCourse(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {modalCourse.code}
              </p>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{modalCourse.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</h3>
                  <p>{modalCourse.category || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Branch</h3>
                  <p>{modalCourse.branch || '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Level</h3>
                  <p>{modalCourse.level}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Credits</h3>
                  <p>{modalCourse.credits}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Duration</h3>
                  <p className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    {modalCourse.duration} weeks
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Capacity</h3>
                  <p className="flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    {modalCourse.enrolledStudents?.length || 0} / {modalCourse.maxStudents} students
                  </p>
                </div>
              </div>

              {modalCourse.instructor && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <AcademicCapIcon className="h-4 w-4" />
                    Instructor
                  </h3>
                  <p>
                    {modalCourse.instructor.firstName} {modalCourse.instructor.lastName}
                    {modalCourse.instructor.email && (
                      <span className="text-gray-500 block text-xs mt-0.5">
                        {modalCourse.instructor.email}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {modalCourse.schedule && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Schedule</h3>
                  <p>
                    {formatDate(modalCourse.schedule.startDate)} –{' '}
                    {formatDate(modalCourse.schedule.endDate)}
                  </p>
                  {(modalCourse.schedule.startTime || modalCourse.schedule.endTime) && (
                    <p className="text-gray-600 mt-1">
                      {modalCourse.schedule.startTime || '—'} –{' '}
                      {modalCourse.schedule.endTime || '—'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setModalCourse(null)}
                className="btn btn-outline order-2 sm:order-1"
              >
                Close
              </button>
              {enrolledInModal ? (
                <button
                  type="button"
                  disabled
                  className="btn btn-secondary order-1 sm:order-2 opacity-80 cursor-not-allowed"
                >
                  Enrolled
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary order-1 sm:order-2"
                  disabled={enrollMutation.isLoading}
                  onClick={() => enrollMutation.mutate(modalCourse._id)}
                >
                  {enrollMutation.isLoading ? 'Enrolling…' : 'Enroll in course'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
