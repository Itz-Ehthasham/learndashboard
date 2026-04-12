import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { assessmentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ScoreEntry = () => {
  const navigate = useNavigate();
  const { id: assessmentId } = useParams();
  const { user, isTrainer, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});

  const {
    data: assessmentData,
    isLoading: assessmentLoading,
    refetch: refetchAssessment
  } = useQuery(
    ['assessment', assessmentId],
    () => assessmentService.getAssessment(assessmentId),
    {
      enabled: !!assessmentId
    }
  );

  const gradeSubmissionMutation = useMutation(
    ({ studentId, score, feedback }) => 
      assessmentService.gradeSubmission(assessmentId, studentId, { score, feedback }),
    {
      onSuccess: () => {
        toast.success('Score saved successfully!');
        refetchAssessment();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save score');
      }
    }
  );

  const handleScoreChange = (studentId, score) => {
    setScores(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  const handleFeedbackChange = (studentId, feedback) => {
    setFeedback(prev => ({
      ...prev,
      [studentId]: feedback
    }));
  };

  const saveScore = (studentId) => {
    const score = scores[studentId];
    const studentFeedback = feedback[studentId];
    
    if (score === undefined || score === '') {
      toast.error('Please enter a score');
      return;
    }

    gradeSubmissionMutation.mutate({
      studentId,
      score: parseFloat(score),
      feedback: studentFeedback || ''
    });
  };

  const saveAllScores = () => {
    const assessmentDoc = assessmentData?.data?.data?.assessment;
    const subs = Array.isArray(assessmentDoc?.submissions) ? assessmentDoc.submissions : [];
    const pendingSubmissions = subs.filter(
      sub => sub.status === 'submitted' && !sub.gradedAt
    );

    let hasErrors = false;
    pendingSubmissions?.forEach(submission => {
      const score = scores[submission.student._id];
      if (score === undefined || score === '') {
        toast.error(`Please enter a score for ${submission.student.firstName} ${submission.student.lastName}`);
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      pendingSubmissions?.forEach(submission => {
        const score = scores[submission.student._id];
        const studentFeedback = feedback[submission.student._id];
        
        gradeSubmissionMutation.mutate({
          studentId: submission.student._id,
          score: parseFloat(score),
          feedback: studentFeedback || ''
        });
      });
    }
  };

  const calculateGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isAdmin() && !isTrainer()) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only trainers and administrators can enter scores.</p>
      </div>
    );
  }

  if (assessmentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  const assessment = assessmentData?.data?.data?.assessment;
  const submissions = Array.isArray(assessment?.submissions) ? assessment.submissions : [];

  const filteredSubmissions = submissions.filter(submission =>
    `${submission.student.firstName} ${submission.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingSubmissions = filteredSubmissions.filter(sub => sub.status === 'submitted' && !sub.gradedAt);
  const gradedSubmissions = filteredSubmissions.filter(sub => sub.gradedAt);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/assessments/${assessmentId}`)}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Assessment
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Score Entry</h1>
        <p className="mt-1 text-sm text-gray-600">
          Grade student submissions for "{assessment?.title}"
        </p>
      </div>
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{assessment?.title}</h3>
              <p className="text-sm text-gray-600">{assessment?.course?.title}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Max Score</p>
                <p className="text-lg font-semibold text-gray-900">{assessment?.maxScore}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Passing Score</p>
                <p className="text-lg font-semibold text-gray-900">{assessment?.passingScore}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-lg font-semibold text-orange-600">{pendingSubmissions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Graded</p>
                <p className="text-lg font-semibold text-green-600">{gradedSubmissions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
            {pendingSubmissions.length > 0 && (
              <button
                onClick={saveAllScores}
                className="btn btn-primary"
                disabled={gradeSubmissionMutation.isLoading}
              >
                {gradeSubmissionMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="spinner h-4 w-4 mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Save All Scores'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {pendingSubmissions.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-orange-600" />
              Pending Submissions ({pendingSubmissions.length})
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {submission.student.firstName} {submission.student.lastName}
                        </h4>
                        <span className="badge badge-orange">Pending</span>
                        <span className="text-sm text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Answers:</h5>
                        <div className="bg-gray-50 rounded p-3 space-y-2">
                          {submission.answers?.slice(0, 3).map((answer, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">Q{answer.questionIndex + 1}:</span> {answer.answer}
                            </div>
                          ))}
                          {submission.answers?.length > 3 && (
                            <div className="text-sm text-gray-500">
                              ... and {submission.answers.length - 3} more answers
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">Score</label>
                          <input
                            type="number"
                            min="0"
                            max={assessment?.maxScore}
                            step="0.1"
                            value={scores[submission.student._id] || ''}
                            onChange={(e) => handleScoreChange(submission.student._id, e.target.value)}
                            className="form-input"
                            placeholder={`0-${assessment?.maxScore}`}
                          />
                        </div>
                        <div>
                          <label className="form-label">Grade</label>
                          <div className="pt-2">
                            {scores[submission.student._id] && (
                              <span className={`text-lg font-bold ${getGradeColor(
                                calculateGrade(parseFloat(scores[submission.student._id]), assessment?.maxScore)
                              )}`}>
                                {calculateGrade(parseFloat(scores[submission.student._id]), assessment?.maxScore)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => saveScore(submission.student._id)}
                            className="btn btn-primary btn-sm"
                            disabled={!scores[submission.student._id] || gradeSubmissionMutation.isLoading}
                          >
                            Save Score
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="form-label">Feedback (Optional)</label>
                        <textarea
                          rows={3}
                          value={feedback[submission.student._id] || ''}
                          onChange={(e) => handleFeedbackChange(submission.student._id, e.target.value)}
                          className="form-input"
                          placeholder="Provide feedback to the student..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {gradedSubmissions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              Graded Submissions ({gradedSubmissions.length})
            </h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Score</th>
                    <th className="table-header-cell">Grade</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Graded Date</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {gradedSubmissions.map((submission) => (
                    <tr key={submission._id} className="table-row">
                      <td className="table-cell">
                        {submission.student.firstName} {submission.student.lastName}
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">{submission.score}</span> / {assessment?.maxScore}
                      </td>
                      <td className="table-cell">
                        <span className={`font-bold ${getGradeColor(
                          calculateGrade(submission.score, assessment?.maxScore)
                        )}`}>
                          {calculateGrade(submission.score, assessment?.maxScore)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          submission.passed ? 'badge-success' : 'badge-danger'
                        }`}>
                          {submission.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {new Date(submission.gradedAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => {
                            setScores(prev => ({
                              ...prev,
                              [submission.student._id]: submission.score
                            }));
                            setFeedback(prev => ({
                              ...prev,
                              [submission.student._id]: submission.feedback || ''
                            }));
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-8">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Students haven't submitted this assessment yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
