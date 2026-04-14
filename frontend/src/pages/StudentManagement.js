import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { userService, courseService, attendanceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  PlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

function localDateInputValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const StudentManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [enrollModalStudent, setEnrollModalStudent] = useState(null);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [attendanceModalStudent, setAttendanceModalStudent] = useState(null);
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(localDateInputValue);
  const [attendanceStatus, setAttendanceStatus] = useState('present');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery('students', () => userService.getUsers({ role: 'student', limit: 500 }), {
    enabled: true
  });

  const {
    data: coursesData,
    isLoading: coursesLoading
  } = useQuery('courses', () => courseService.getCourses({ limit: 500 }), {
    enabled: true
  });

  const allCourses = coursesData?.data?.data?.courses ?? [];

  const enrollAdminMutation = useMutation(
    ({ courseId, studentId }) => courseService.enrollStudentAsAdmin(courseId, studentId),
    {
      onSuccess: () => {
        toast.success('Student enrolled in course');
        setEnrollModalStudent(null);
        setEnrollCourseId('');
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Enrollment failed');
      },
    }
  );

  const attendanceQuickMutation = useMutation(
    (payload) => attendanceService.saveAttendanceDayBulk(payload),
    {
      onSuccess: () => {
        toast.success('Attendance saved');
        setAttendanceModalStudent(null);
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Could not save attendance');
      },
    }
  );

  const createStudentMutation = useMutation(
    userService.createUser,
    {
      onSuccess: (response) => {
        console.log('Student creation successful:', response);
        toast.success('Student created successfully!');
        reset();
        setShowCreateForm(false);
        refetchUsers();
      },
      onError: (error) => {
        console.error('Student creation error:', error);
        console.error('Error response:', error.response);
        toast.error(error.response?.data?.message || 'Failed to create student');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const updateStudentMutation = useMutation(
    ({ id, data }) => userService.updateUser(id, data),
    {
      onSuccess: () => {
        toast.success('Student updated successfully!');
        setEditingStudent(null);
        reset();
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update student');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const deleteStudentMutation = useMutation(
    userService.deleteUser,
    {
      onSuccess: () => {
        toast.success('Student deleted successfully!');
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete student');
      }
    }
  );

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);

    try {
      const studentData = {
        ...data,
        role: 'student',
        password: 'Student123',
        academicInfo: {
          section: data.section,
          year: data.year ? parseInt(data.year) : undefined,
          semester: data.semester,
          batch: data.batch
        },
        courses: data.courses || []
      };

      console.log('Student data prepared:', studentData);

      if (editingStudent) {
        updateStudentMutation.mutate({ id: editingStudent._id, data: studentData });
      } else {
        createStudentMutation.mutate(studentData);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Error creating student: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setValue('firstName', student.firstName);
    setValue('lastName', student.lastName);
    setValue('email', student.email);
    setValue('studentId', student.studentId);
            setValue('section', student.academicInfo?.section);
    setValue('year', student.academicInfo?.year);
    setValue('semester', student.academicInfo?.semester);
    setValue('batch', student.academicInfo?.batch);
    setValue('courses', student.enrolledCourses?.map(c => c._id) || []);
    setShowCreateForm(true);
  };

  const handleDelete = (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      deleteStudentMutation.mutate(student._id);
    }
  };

  const courseIdOf = (c) => (c && typeof c === 'object' ? c._id : c);

  const coursesAvailableForEnroll = useMemo(() => {
    if (!enrollModalStudent) return [];
    const enrolledIds = new Set(
      (enrollModalStudent.enrolledCourses || []).map(courseIdOf).filter(Boolean).map(String)
    );
    return allCourses.filter((c) => c.isActive !== false && !enrolledIds.has(String(c._id)));
  }, [enrollModalStudent, allCourses]);

  const openEnrollModal = (student) => {
    setEnrollModalStudent(student);
    setEnrollCourseId('');
  };

  const openAttendanceModal = (student) => {
    setAttendanceModalStudent(student);
    const enrolled = student.enrolledCourses || [];
    const firstId = enrolled[0] ? courseIdOf(enrolled[0]) : '';
    setAttendanceCourseId(firstId ? String(firstId) : '');
    setAttendanceDate(localDateInputValue());
    setAttendanceStatus('present');
  };

  const submitEnrollModal = () => {
    if (!enrollModalStudent || !enrollCourseId) {
      toast.error('Select a course');
      return;
    }
    enrollAdminMutation.mutate({
      courseId: enrollCourseId,
      studentId: enrollModalStudent._id,
    });
  };

  const submitAttendanceModal = () => {
    if (!attendanceModalStudent || !attendanceCourseId) {
      toast.error('Select a course');
      return;
    }
    attendanceQuickMutation.mutate({
      courseId: attendanceCourseId,
      date: attendanceDate,
      entries: [{ studentId: attendanceModalStudent._id, status: attendanceStatus }],
    });
  };

  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvData = e.target.result;
          const lines = csvData.split('\n');
          const headers = lines[0].split(',');
          
          const students = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              firstName: values[0]?.trim(),
              lastName: values[1]?.trim(),
              email: values[2]?.trim(),
              studentId: values[3]?.trim(),
              section: values[4]?.trim(),
              year: parseInt(values[5]) || undefined,
              semester: values[6]?.trim(),
              batch: values[7]?.trim(),
              role: 'student'
            };
          }).filter(student => student.email);

          
          students.forEach(studentData => {
            createStudentMutation.mutate(studentData);
          });
          
          toast.success(`${students.length} students imported successfully!`);
          setShowBulkImport(false);
        } catch (error) {
          toast.error('Error parsing CSV file');
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `firstName,lastName,email,studentId,section,year,semester,batch
John,Doe,john.doe@school.com,ST001,A,3,1,2024
Jane,Smith,jane.smith@school.com,ST002,B,3,1,2024`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateAttendanceRate = (total, attended) => {
    if (total === 0) return 0;
    return ((attended / total) * 100).toFixed(1);
  };

  const studentsList = usersData?.data?.data?.users;
  const studentsArray = Array.isArray(studentsList) ? studentsList : [];
  const filteredStudents = studentsArray.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage student details and academic information. Record class attendance per day on{' '}
          <Link to="/students/attendance" className="text-blue-600 hover:text-blue-700 font-medium">
            Daily attendance
          </Link>
          .
        </p>
      </div>
      <div className="mb-4">
        <Link to="/students/attendance" className="btn btn-secondary inline-flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Daily attendance
        </Link>
      </div>
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingStudent(null);
                  reset();
                }}
                className="btn btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Student
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="btn btn-secondary"
              >
                <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                Bulk Import
              </button>
              <button
                onClick={downloadSampleCSV}
                className="btn btn-outline"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Sample CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {filteredStudents.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <CalendarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Attendance</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {filteredStudents.length > 0 
                      ? (filteredStudents.reduce((sum, student) => {
                          const rate = calculateAttendanceRate(student.attendance?.totalSessions, student.attendance?.attendedSessions);
                          return sum + parseFloat(rate);
                        }, 0) / filteredStudents.length || 0).toFixed(1) + '%'
                      : 'N/A'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <BookOpenIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Courses</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {allCourses.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Students List</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Student ID</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Section</th>
                  <th className="table-header-cell">Year</th>
                                    <th className="table-header-cell">Attendance</th>
                  <th className="table-header-cell">Courses</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-700">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.academicInfo?.batch}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{student.studentId || 'N/A'}</span>
                    </td>
                    <td className="table-cell">{student.email}</td>
                    <td className="table-cell">
                      {student.academicInfo?.section}
                    </td>
                    <td className="table-cell">Year {student.academicInfo?.year}</td>
                                        <td className="table-cell">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          calculateAttendanceRate(student.attendance?.totalSessions, student.attendance?.attendedSessions) >= 90 ? 'text-green-600' :
                          calculateAttendanceRate(student.attendance?.totalSessions, student.attendance?.attendedSessions) >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {calculateAttendanceRate(student.attendance?.totalSessions, student.attendance?.attendedSessions)}%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({student.attendance?.attendedSessions || 0}/{student.attendance?.totalSessions || 0})
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {student.enrolledCourses?.length || 0} courses
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center flex-wrap gap-1">
                        {isAdmin() && (
                          <>
                            <button
                              type="button"
                              title="Enroll in a course"
                              onClick={() => openEnrollModal(student)}
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                            >
                              <BookOpenIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Record attendance"
                              onClick={() => openAttendanceModal(student)}
                              className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50"
                            >
                              <CalendarDaysIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="Edit student"
                          onClick={() => handleEdit(student)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete student"
                          onClick={() => handleDelete(student)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new student.'}
              </p>
            </div>
          )}
        </div>
      </div>
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name *</label>
                      <input
                        {...register('firstName', { required: 'First name is required' })}
                        type="text"
                        className="form-input"
                        placeholder="John"
                      />
                      {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Last Name *</label>
                      <input
                        {...register('lastName', { required: 'Last name is required' })}
                        type="text"
                        className="form-input"
                        placeholder="Doe"
                      />
                      {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Email *</label>
                      <input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className="form-input"
                        placeholder="john.doe@school.com"
                      />
                      {errors.email && <p className="form-error">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Student ID (Optional)</label>
                      <input
                        {...register('studentId')}
                        type="text"
                        className="form-input"
                        placeholder="ST001 (leave empty for auto-generation)"
                      />
                    </div>
                    <div>
                      <label className="form-label">Section</label>
                      <input
                        {...register('section')}
                        type="text"
                        className="form-input"
                        placeholder="A"
                      />
                    </div>

                    <div>
                      <label className="form-label">Year</label>
                      <select
                        {...register('year')}
                        className="form-input"
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                        <option value="6">Year 6</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Semester</label>
                      <select
                        {...register('semester')}
                        className="form-input"
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Batch</label>
                      <input
                        {...register('batch')}
                        type="text"
                        className="form-input"
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Enrolled Courses</label>
                      <select
                        {...register('courses')}
                        multiple
                        className="form-input"
                        size={4}
                      >
                        {coursesData?.data?.data?.courses?.map(course => (
                          <option key={course._id} value={course._id}>
                            {course.title} ({course.code})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple courses</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full sm:ml-3 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="spinner h-4 w-4 mr-2" />
                        {editingStudent ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      editingStudent ? 'Update Student' : 'Create Student'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingStudent(null);
                      reset();
                    }}
                    className="btn btn-outline mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowBulkImport(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import Students</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a CSV file with student information. Download the sample template to see the required format.
                  </p>
                  
                  <button
                    onClick={downloadSampleCSV}
                    className="btn btn-secondary w-full mb-4"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </button>
                </div>

                <div>
                  <label className="form-label">Choose CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkImport}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="btn btn-primary w-full sm:ml-3 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {enrollModalStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 sm:p-0">
            <button
              type="button"
              className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity border-0 cursor-default"
              aria-label="Close"
              onClick={() => {
                setEnrollModalStudent(null);
                setEnrollCourseId('');
              }}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full text-left">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Enroll in course</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {enrollModalStudent.firstName} {enrollModalStudent.lastName}
                </p>
                <label className="form-label">Course</label>
                <select
                  className="form-input"
                  value={enrollCourseId}
                  onChange={(e) => setEnrollCourseId(e.target.value)}
                >
                  <option value="">Select a course</option>
                  {coursesAvailableForEnroll.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
                {coursesAvailableForEnroll.length === 0 && (
                  <p className="text-sm text-amber-700 mt-2">This student is already in all available courses.</p>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEnrollModalStudent(null);
                    setEnrollCourseId('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!enrollCourseId || enrollAdminMutation.isLoading}
                  onClick={submitEnrollModal}
                >
                  {enrollAdminMutation.isLoading ? 'Enrolling…' : 'Enroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {attendanceModalStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 sm:p-0">
            <button
              type="button"
              className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity border-0 cursor-default"
              aria-label="Close"
              onClick={() => setAttendanceModalStudent(null)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full text-left">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Record attendance</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {attendanceModalStudent.firstName} {attendanceModalStudent.lastName}
                </p>
                {(attendanceModalStudent.enrolledCourses || []).length === 0 ? (
                  <p className="text-sm text-amber-700">
                    Enroll this student in a course first, then record attendance for that class day.
                  </p>
                ) : (
                  <>
                    <label className="form-label">Course</label>
                    <select
                      className="form-input mb-3"
                      value={attendanceCourseId}
                      onChange={(e) => setAttendanceCourseId(e.target.value)}
                    >
                      {(attendanceModalStudent.enrolledCourses || []).map((c) => {
                        const id = courseIdOf(c);
                        const idStr = String(id);
                        const fromList = allCourses.find((ac) => String(ac._id) === idStr);
                        const meta = typeof c === 'object' && c.code ? c : fromList;
                        const label =
                          meta && meta.code
                            ? `${meta.code} — ${meta.title || ''}`.trim()
                            : `Course ${idStr}`;
                        return (
                          <option key={idStr} value={idStr}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input mb-3"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                      <option value="absent">Absent</option>
                    </select>
                  </>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAttendanceModalStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    (attendanceModalStudent.enrolledCourses || []).length === 0 ||
                    !attendanceCourseId ||
                    attendanceQuickMutation.isLoading
                  }
                  onClick={submitAttendanceModal}
                >
                  {attendanceQuickMutation.isLoading ? 'Saving…' : 'Save attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
