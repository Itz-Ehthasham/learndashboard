import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { assessmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

const Assessments = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();
  
  const { data: assessmentsData, isLoading, error } = useQuery(
    'assessments',
    assessmentService.getAssessments
  );

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading assessments</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const assessments = assessmentsData?.data?.data?.assessments || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage assessments for your courses.
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            onClick={() => navigate('/assessments/create')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Assessment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((assessment) => (
          <div key={assessment._id} className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{assessment.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{assessment.type}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {assessment.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {assessment.duration} minutes
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Max score: {assessment.maxScore}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="badge badge-warning capitalize">{assessment.type}</span>
                <span className="badge badge-info">{assessment.maxScore} points</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new assessment.
          </p>
        </div>
      )}
    </div>
  );
};

export default Assessments;
