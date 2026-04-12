import axios from 'axios';

// Create base axios instance
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Auth API instance
export const authAPI = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Main API instance
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor — 401 on protected routes clears session (not on failed login/register)
const handleInterceptorError = (error) => {
  const status = error.response?.status;
  const reqPath = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
  const isAuthAttempt =
    reqPath.includes('/auth/login') ||
    reqPath.includes('/auth/register') ||
    (error.config?.url || '').includes('/auth/login') ||
    (error.config?.url || '').includes('/auth/register');

  if (status === 401 && !isAuthAttempt) {
    localStorage.removeItem('token');
    try {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    } catch (_) {
      /* ignore */
    }
    const path = window.location?.pathname || '';
    if (!path.includes('/login') && !path.includes('/register')) {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

// Add interceptors
authAPI.interceptors.request.use(addAuthToken);
authAPI.interceptors.response.use((response) => response, handleInterceptorError);

api.interceptors.request.use(addAuthToken);
api.interceptors.response.use((response) => response, handleInterceptorError);

// API endpoints
export const endpoints = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify-token',
  },
  
  // User endpoints
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    DEACTIVATE: (id) => `/users/${id}/deactivate`,
    ACTIVATE: (id) => `/users/${id}/activate`,
    STATS: '/users/stats/overview',
    SEARCH: '/users/search',
  },
  
  // Course endpoints
  COURSES: {
    LIST: '/courses',
    DETAIL: (id) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id) => `/courses/${id}`,
    DELETE: (id) => `/courses/${id}`,
    ENROLL: (id) => `/courses/${id}/enroll`,
    UNENROLL: (id) => `/courses/${id}/unenroll`,
    MY_COURSES: '/courses/my-courses',
    STATS: '/courses/stats/overview',
  },
  
  // Assessment endpoints
  ASSESSMENTS: {
    LIST: '/assessments',
    DETAIL: (id) => `/assessments/${id}`,
    CREATE: '/assessments',
    UPDATE: (id) => `/assessments/${id}`,
    DELETE: (id) => `/assessments/${id}`,
    SUBMIT: (id) => `/assessments/${id}/submit`,
    GRADE: (id, studentId) => `/assessments/${id}/grade/${studentId}`,
    MY_ASSESSMENTS: '/assessments/my-assessments',
    UPCOMING: '/assessments/upcoming',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    USER: (userId) => `/analytics/user/${userId}`,
    COURSE: (courseId) => `/analytics/course/${courseId}`,
    GENERATE_PERFORMANCE: '/analytics/generate/performance',
    GENERATE_ATTENDANCE: '/analytics/generate/attendance',
    GENERATE_ENGAGEMENT: '/analytics/generate/engagement',
    GENERATE_PROGRESS: '/analytics/generate/progress',
    REPORTS_PERFORMANCE: '/analytics/reports/performance',
    REPORTS_ATTENDANCE: '/analytics/reports/attendance',
    SUMMARY: (courseId) => `/analytics/summary/${courseId}`,
  },
};

// API service functions
export const authService = {
  login: (credentials) => authAPI.post(endpoints.AUTH.LOGIN, credentials),
  register: (userData) => authAPI.post(endpoints.AUTH.REGISTER, userData),
  getProfile: () => authAPI.get(endpoints.AUTH.PROFILE),
  updateProfile: (data) => authAPI.put(endpoints.AUTH.PROFILE, data),
  changePassword: (data) => authAPI.post(endpoints.AUTH.CHANGE_PASSWORD, data),
  logout: () => authAPI.post(endpoints.AUTH.LOGOUT),
  verifyToken: () => authAPI.get(endpoints.AUTH.VERIFY_TOKEN),
};

export const userService = {
  getUsers: (params) => api.get(endpoints.USERS.LIST, { params }),
  getUser: (id) => api.get(endpoints.USERS.DETAIL(id)),
  createUser: (data) => authAPI.post(endpoints.AUTH.REGISTER, data),
  updateUser: (id, data) => api.put(endpoints.USERS.UPDATE(id), data),
  deleteUser: (id) => api.delete(endpoints.USERS.DELETE(id)),
  deactivateUser: (id) => api.post(endpoints.USERS.DEACTIVATE(id)),
  activateUser: (id) => api.post(endpoints.USERS.ACTIVATE(id)),
  getUserStats: () => api.get(endpoints.USERS.STATS),
  searchUsers: (params) => api.get(endpoints.USERS.SEARCH, { params }),
};

export const courseService = {
  getCourses: (params) => api.get(endpoints.COURSES.LIST, { params }),
  getCourse: (id) => api.get(endpoints.COURSES.DETAIL(id)),
  createCourse: (data) => api.post(endpoints.COURSES.CREATE, data),
  updateCourse: (id, data) => api.put(endpoints.COURSES.UPDATE(id), data),
  deleteCourse: (id) => api.delete(endpoints.COURSES.DELETE(id)),
  enrollInCourse: (id) => api.post(endpoints.COURSES.ENROLL(id)),
  unenrollFromCourse: (id) => api.post(endpoints.COURSES.UNENROLL(id)),
  getMyCourses: () => api.get(endpoints.COURSES.MY_COURSES),
  getCourseStats: () => api.get(endpoints.COURSES.STATS),
};

export const assessmentService = {
  getAssessments: (params) => api.get(endpoints.ASSESSMENTS.LIST, { params }),
  getAssessment: (id) => api.get(endpoints.ASSESSMENTS.DETAIL(id)),
  createAssessment: (data) => api.post(endpoints.ASSESSMENTS.CREATE, data),
  updateAssessment: (id, data) => api.put(endpoints.ASSESSMENTS.UPDATE(id), data),
  deleteAssessment: (id) => api.delete(endpoints.ASSESSMENTS.DELETE(id)),
  submitAssessment: (id, data) => api.post(endpoints.ASSESSMENTS.SUBMIT(id), data),
  gradeSubmission: (id, studentId, data) => api.post(endpoints.ASSESSMENTS.GRADE(id, studentId), data),
  getMyAssessments: () => api.get(endpoints.ASSESSMENTS.MY_ASSESSMENTS),
  getUpcomingAssessments: () => api.get(endpoints.ASSESSMENTS.UPCOMING),
};

export const analyticsService = {
  getDashboardAnalytics: () => api.get(endpoints.ANALYTICS.DASHBOARD),
  getUserAnalytics: (userId, params) => api.get(endpoints.ANALYTICS.USER(userId), { params }),
  getCourseAnalytics: (courseId, params) => api.get(endpoints.ANALYTICS.COURSE(courseId), { params }),
  generatePerformanceAnalytics: (data) => api.post(endpoints.ANALYTICS.GENERATE_PERFORMANCE, data),
  generateAttendanceAnalytics: (data) => api.post(endpoints.ANALYTICS.GENERATE_ATTENDANCE, data),
  generateEngagementAnalytics: (data) => api.post(endpoints.ANALYTICS.GENERATE_ENGAGEMENT, data),
  generateProgressAnalytics: (data) => api.post(endpoints.ANALYTICS.GENERATE_PROGRESS, data),
  getPerformanceReport: (params) => api.get(endpoints.ANALYTICS.REPORTS_PERFORMANCE, { params }),
  getAttendanceReport: (params) => api.get(endpoints.ANALYTICS.REPORTS_ATTENDANCE, { params }),
  getCourseSummary: (courseId) => api.get(endpoints.ANALYTICS.SUMMARY(courseId)),
};

// Utility function to handle API responses
export const handleAPIResponse = (response) => {
  return response.data;
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data.message || 'Server error',
      errors: error.response.data.errors || [],
      status: error.response.status,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

export default api;
