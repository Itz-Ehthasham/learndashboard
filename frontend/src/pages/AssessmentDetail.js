import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { assessmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
};

const AssessmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isStudent, isTrainer, isAdmin } = useAuth();
  const [answers, setAnswers] = useState({});

  const {
    data: res,
    isLoading,
    error,
    isError
  } = useQuery(
    ['assessment', id],
    () => assessmentService.getAssessment(id),
    { enabled: !!id, retry: 1 }
  );

  const assessment = res?.data?.data?.assessment ?? null;

  const existingSubmission = useMemo(() => {
    if (!assessment?.submissions || !user?._id) return null;
    const uid = user._id.toString();
    return assessment.submissions.find((s) => {
      const sid = s.student?._id ?? s.student;
      return sid && sid.toString() === uid && s.status === 'submitted';
    });
  }, [assessment, user]);

  const submitMutation = useMutation(
    (payload) => assessmentService.submitAssessment(id, payload),
    {
      onSuccess: () => {
        toast.success('Assessment submitted successfully');
        queryClient.invalidateQueries(['assessment', id]);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to submit');
      }
    }
  );

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assessment?.questions?.length) return;
    const payload = {
      answers: assessment.questions.map((_, i) => ({
        answer: answers[i] != null ? String(answers[i]) : ''
      })),
      timeSpent: 0
    };
    submitMutation.mutate(payload);
  };

  const renderQuestionInput = (q, index) => {
    const val = answers[index] ?? '';
    if (q.type === 'multiple-choice' && q.options?.length) {
      return (
        <select
          className="form-input mt-2"
          value={val}
          onChange={(e) => handleAnswerChange(index, e.target.value)}
          required
        >
          <option value="">Select an answer</option>
          {q.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (q.type === 'true-false') {
      return (
        <select
          className="form-input mt-2"
          value={val}
          onChange={(e) => handleAnswerChange(index, e.target.value)}
          required
        >
          <option value="">Select</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    return (
      <textarea
        className="form-input mt-2"
        rows={q.type === 'essay' ? 6 : 3}
        value={val}
        onChange={(e) => handleAnswerChange(index, e.target.value)}
        placeholder="Your answer"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Could not load assessment</h3>
        <p className="text-gray-600 mb-4">
          {error?.response?.data?.message || 'The assessment may be unavailable or you may not have access.'}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/assessments')}>
          Back to assessments
        </button>
      </div>
    );
  }

  const courseTitle = assessment.course?.title || assessment.course?.code || 'Course';
  const instructions = assessment.instructions?.trim?.() ? assessment.instructions : null;
  const canTake =
    isStudent() &&
    assessment.isPublished !== false &&
    !existingSubmission &&
    new Date() <= new Date(assessment.dueDate);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/assessments')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to assessments
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{assessment.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="inline-flex items-center">
            <AcademicCapIcon className="h-4 w-4 mr-1" />
            {courseTitle}
          </span>
          <span className="inline-flex items-center capitalize">
            <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
            {assessment.type}
          </span>
          <span className="inline-flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {assessment.duration} min
          </span>
          <span className="inline-flex items-center">
            <CalendarDaysIcon className="h-4 w-4 mr-1" />
            Due {formatDate(assessment.dueDate)}
          </span>
        </div>
      </div>

      {instructions && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Instructions</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700 whitespace-pre-wrap">{instructions}</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Questions</h2>
          <span className="text-sm text-gray-500">
            {assessment.questions?.length || 0} question(s) · Max {assessment.maxScore} pts
          </span>
        </div>
        <div className="card-body space-y-8">
          {(!assessment.questions || assessment.questions.length === 0) && (
            <p className="text-gray-500">No questions have been added to this assessment yet.</p>
          )}

          {isStudent() && assessment.isPublished === false && (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
              This assessment is not published yet. Check back after your instructor publishes it.
            </p>
          )}

          {isStudent() && existingSubmission && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              <p className="font-medium">Submitted</p>
              <p className="text-sm mt-1">
                Score: {existingSubmission.score != null ? `${existingSubmission.score} (${existingSubmission.percentage?.toFixed?.(1) ?? '—'}%)` : 'Pending grading'}
              </p>
            </div>
          )}

          {isStudent() && !existingSubmission && new Date() > new Date(assessment.dueDate) && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">The due date for this assessment has passed.</p>
          )}

          {(isTrainer() || isAdmin()) && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
              <p className="font-medium">Instructor view</p>
              <p className="mt-1">
                Visible to students enrolled in this course when published. {assessment.submissions?.length || 0}{' '}
                submission(s).
              </p>
            </div>
          )}

          {canTake && assessment.questions?.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {assessment.questions.map((q, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                  <p className="font-medium text-gray-900 mb-2">
                    {index + 1}. {q.question}
                    <span className="text-gray-500 font-normal ml-2">({q.points} pts)</span>
                  </p>
                  {renderQuestionInput(q, index)}
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitMutation.isLoading}
                >
                  {submitMutation.isLoading ? 'Submitting…' : 'Submit assessment'}
                </button>
              </div>
            </form>
          )}

          {(isTrainer() || isAdmin()) &&
            assessment.questions?.map((q, index) => (
              <div key={`ro-${index}`} className="border rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {index + 1}. {q.question}
                </p>
                <p className="text-sm text-gray-500 mt-1">Type: {q.type} · {q.points} pts</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
