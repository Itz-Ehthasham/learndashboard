import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { assessmentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const AssessmentCreate = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([
    { question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 10 }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const {
    data: coursesData,
    isLoading: coursesLoading
  } = useQuery('courses', courseService.getCourses, {
    enabled: isTrainer() || isAdmin()
  });

  const createAssessmentMutation = useMutation(assessmentService.createAssessment, {
    onSuccess: (response) => {
      toast.success('Assessment created successfully!');
      navigate(`/assessments/${response.data.data.assessment._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create assessment');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10
    }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // Validate questions
    const validQuestions = questions.filter(q => q.question.trim() !== '');
    if (validQuestions.length === 0) {
      toast.error('Please add at least one question');
      setIsSubmitting(false);
      return;
    }

    // Format the data for API
    const assessmentData = {
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      questions: validQuestions.map(q => ({
        question: q.question,
        type: q.type,
        options: q.type === 'multiple-choice' ? q.options.filter(opt => opt.trim() !== '') : [],
        correctAnswer: q.correctAnswer,
        points: q.points || 10
      }))
    };

    createAssessmentMutation.mutate(assessmentData);
  };

  const assessmentTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false', label: 'True/False' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' }
  ];

  if (!isAdmin() && !isTrainer()) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only trainers and administrators can create assessments.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/assessments')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create an assessment for your students.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Assessment Information
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="form-label">
                  Assessment Title *
                </label>
                <input
                  {...register('title', {
                    required: 'Assessment title is required',
                    maxLength: {
                      value: 200,
                      message: 'Title cannot exceed 200 characters'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="e.g., Midterm Exam - JavaScript Basics"
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="form-label">
                  Assessment Type *
                </label>
                <select
                  {...register('type', { required: 'Assessment type is required' })}
                  className="form-input"
                >
                  <option value="">Select type</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="lab">Lab Work</option>
                </select>
                {errors.type && (
                  <p className="form-error">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters long'
                  }
                })}
                rows={4}
                className="form-input"
                placeholder="Provide instructions for this assessment..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="course" className="form-label">
                Course *
              </label>
              <select
                {...register('course', { required: 'Course is required' })}
                className="form-input"
                disabled={coursesLoading}
              >
                <option value="">Select a course</option>
                {coursesData?.data?.data?.courses?.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title} ({course.code})
                  </option>
                ))}
              </select>
              {coursesLoading && (
                <p className="text-sm text-gray-500 mt-1">Loading courses...</p>
              )}
              {errors.course && (
                <p className="form-error">{errors.course.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="maxScore" className="form-label">
                  Maximum Score *
                </label>
                <input
                  {...register('maxScore', {
                    required: 'Maximum score is required',
                    min: {
                      value: 1,
                      message: 'Maximum score must be at least 1'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="100"
                />
                {errors.maxScore && (
                  <p className="form-error">{errors.maxScore.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="passingScore" className="form-label">
                  Passing Score *
                </label>
                <input
                  {...register('passingScore', {
                    required: 'Passing score is required',
                    min: {
                      value: 0,
                      message: 'Passing score must be at least 0'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="60"
                />
                {errors.passingScore && (
                  <p className="form-error">{errors.passingScore.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="form-label">
                  Duration (minutes) *
                </label>
                <input
                  {...register('duration', {
                    required: 'Duration is required',
                    min: {
                      value: 1,
                      message: 'Duration must be at least 1 minute'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="60"
                />
                {errors.duration && (
                  <p className="form-error">{errors.duration.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Schedule
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="scheduledDate" className="form-label">
                  Scheduled Date
                </label>
                <input
                  {...register('scheduledDate')}
                  type="datetime-local"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="form-label">
                  Due Date
                </label>
                <input
                  {...register('dueDate')}
                  type="datetime-local"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Questions
            </h3>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-secondary btn-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>
          <div className="card-body space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-medium text-gray-900">Question {index + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="form-label">Question *</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                    rows={3}
                    className="form-input"
                    placeholder="Enter your question..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Question Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                      className="form-input"
                    >
                      {assessmentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Points</label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 0)}
                      className="form-input"
                      placeholder="10"
                      min="1"
                    />
                  </div>
                </div>

                {question.type === 'multiple-choice' && (
                  <div>
                    <label className="form-label">Options</label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                            className="form-input flex-1"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Correct Answer *</label>
                  {question.type === 'multiple-choice' ? (
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select correct option</option>
                      {question.options.map((option, optionIndex) => (
                        option.trim() && (
                          <option key={optionIndex} value={option}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </option>
                        )
                      ))}
                    </select>
                  ) : question.type === 'true-false' ? (
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <textarea
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                      rows={2}
                      className="form-input"
                      placeholder="Enter the correct answer or reference answer..."
                    />
                  )}
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/assessments')}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="spinner h-4 w-4 mr-2" />
                Creating Assessment...
              </div>
            ) : (
              'Create Assessment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentCreate;
