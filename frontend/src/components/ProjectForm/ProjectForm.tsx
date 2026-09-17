import { useState, type FormEvent } from 'react';
import type { ProjectStatus, ProjectType } from '../../types/dashboard';
import { FormField } from '../FormField/FormField';
import type { CreateProjectInput } from '../../services/projectService';
import { getApiErrorMessage } from '../../services/apiError';
import { useProjectStore } from '../../store/projectStore';

const PROJECT_TYPES: ProjectType[] = [
  'Forest Restoration',
  'Mangrove',
  'Biodiversity',
  'Agroforestry',
  'Wetland Conservation',
];

const PROJECT_STATUSES: ProjectStatus[] = ['Active', 'Planning', 'Completed', 'Paused'];

interface FormErrors {
  name?: string;
  description?: string;
  country?: string;
  region?: string;
  start_date?: string;
  end_date?: string;
}

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Create Project form used inside the Create Project modal. Handles
 * client-side validation plus loading/success/error submission states.
 * Persists via `projectStore.createProject`, which POSTs to FastAPI and
 * caches the server-returned project so list views update immediately —
 * no page refresh needed.
 */
export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const createProject = useProjectStore((state) => state.createProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Forest Restoration');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = 'Project name is required.';
    if (!description.trim()) nextErrors.description = 'A short description helps your team.';
    if (!country.trim()) nextErrors.country = 'Country is required.';
    if (!region.trim()) nextErrors.region = 'Region is required.';
    if (!startDate) nextErrors.start_date = 'Start date is required.';
    if (endDate && startDate && endDate < startDate) {
      nextErrors.end_date = 'End date cannot be before the start date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const input: CreateProjectInput = {
        name: name.trim(),
        description: description.trim(),
        project_type: projectType,
        country: country.trim(),
        region: region.trim(),
        start_date: startDate,
        end_date: endDate || null,
        status,
      };
      await createProject(input);
      onSuccess();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to create the project. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-space-md" noValidate>
      <FormField
        id="project-name"
        label="Project Name"
        placeholder="Western Ghats Restoration"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <div className="flex flex-col gap-1 text-left">
        <label htmlFor="project-description" className="font-body-sm text-body-sm font-medium text-on-surface">
          Description
        </label>
        <textarea
          id="project-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of the restoration initiative…"
          className={`w-full rounded-lg border px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-surface-tint resize-none ${
            errors.description ? 'border-error' : 'border-outline-variant'
          }`}
        />
        {errors.description && (
          <span role="alert" className="font-body-sm text-body-sm text-error">
            {errors.description}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <div className="flex flex-col gap-1 text-left">
          <label htmlFor="project-type" className="font-body-sm text-body-sm font-medium text-on-surface">
            Project Type
          </label>
          <select
            id="project-type"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
            className="w-full rounded-lg border border-outline-variant px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label htmlFor="project-status" className="font-body-sm text-body-sm font-medium text-on-surface">
            Status
          </label>
          <select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-lg border border-outline-variant px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <FormField
          id="project-country"
          label="Country"
          placeholder="India"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          error={errors.country}
        />
        <FormField
          id="project-region"
          label="Region"
          placeholder="Maharashtra"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          error={errors.region}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <FormField
          id="project-start-date"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.start_date}
        />
        <FormField
          id="project-end-date"
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.end_date}
        />
      </div>

      {submitError && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {submitError}
        </p>
      )}

      <div className="flex items-center justify-end gap-space-sm mt-space-sm">
        <button
          type="button"
          onClick={onCancel}
          className="px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin" aria-hidden="true" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Create Project
            </>
          )}
        </button>
      </div>
    </form>
  );
}
