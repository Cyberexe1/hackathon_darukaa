import { useState, type FormEvent } from 'react';
import { FormField } from '../FormField/FormField';
import { getApiErrorMessage } from '../../services/apiError';
import type { SiteMetric, SiteMetricInput } from '../../types/dashboard';

interface FormErrors {
  recorded_at?: string;
  carbon_tco2e?: string;
  biodiversity_score?: string;
  vegetation_index?: string;
  tree_cover_percentage?: string;
}

interface MetricFormProps {
  /** Present when editing an existing measurement; absent when adding a new one. */
  initial?: SiteMetric;
  onSubmit: (input: SiteMetricInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * Add/Edit Measurement form used by the Site Analytics page. Client-side
 * validation mirrors the backend's authoritative range checks (see
 * backend/app/schemas/metric.py) so users get instant feedback, but the
 * backend is still the final authority — any 422 it returns is surfaced
 * via `getApiErrorMessage` rather than assumed impossible.
 */
export function MetricForm({ initial, onSubmit, onCancel }: MetricFormProps) {
  const [recordedAt, setRecordedAt] = useState(initial?.recorded_at ?? '');
  const [carbon, setCarbon] = useState(initial ? String(initial.carbon_tco2e) : '');
  const [biodiversity, setBiodiversity] = useState(
    initial ? String(initial.biodiversity_score) : '',
  );
  const [vegetation, setVegetation] = useState(initial ? String(initial.vegetation_index) : '');
  const [treeCover, setTreeCover] = useState(initial ? String(initial.tree_cover_percentage) : '');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!recordedAt) nextErrors.recorded_at = 'Date is required.';

    const carbonNum = Number(carbon);
    if (carbon === '' || Number.isNaN(carbonNum) || carbonNum < 0) {
      nextErrors.carbon_tco2e = 'Carbon must be a non-negative number.';
    }

    const bioNum = Number(biodiversity);
    if (biodiversity === '' || Number.isNaN(bioNum) || bioNum < 0 || bioNum > 100) {
      nextErrors.biodiversity_score = 'Biodiversity score must be between 0 and 100.';
    }

    const vegNum = Number(vegetation);
    if (vegetation === '' || Number.isNaN(vegNum) || vegNum < 0 || vegNum > 1) {
      nextErrors.vegetation_index = 'Vegetation index must be between 0 and 1.';
    }

    const treeNum = Number(treeCover);
    if (treeCover === '' || Number.isNaN(treeNum) || treeNum < 0 || treeNum > 100) {
      nextErrors.tree_cover_percentage = 'Tree cover must be between 0 and 100%.';
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
      await onSubmit({
        recorded_at: recordedAt,
        carbon_tco2e: Number(carbon),
        biodiversity_score: Number(biodiversity),
        vegetation_index: Number(vegetation),
        tree_cover_percentage: Number(treeCover),
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to save this measurement. Please try again.'),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-space-md" noValidate>
      <FormField
        id="metric-recorded-at"
        label="Date"
        type="date"
        value={recordedAt}
        onChange={(e) => setRecordedAt(e.target.value)}
        error={errors.recorded_at}
      />
      <FormField
        id="metric-carbon"
        label="Carbon (tCO\u2082e)"
        type="number"
        min={0}
        step="0.01"
        value={carbon}
        onChange={(e) => setCarbon(e.target.value)}
        error={errors.carbon_tco2e}
      />
      <FormField
        id="metric-biodiversity"
        label="Biodiversity Score (0-100)"
        type="number"
        min={0}
        max={100}
        step="0.1"
        value={biodiversity}
        onChange={(e) => setBiodiversity(e.target.value)}
        error={errors.biodiversity_score}
      />
      <FormField
        id="metric-vegetation"
        label="Vegetation Index (0-1)"
        type="number"
        min={0}
        max={1}
        step="0.01"
        value={vegetation}
        onChange={(e) => setVegetation(e.target.value)}
        error={errors.vegetation_index}
      />
      <FormField
        id="metric-tree-cover"
        label="Tree Cover % (0-100)"
        type="number"
        min={0}
        max={100}
        step="0.1"
        value={treeCover}
        onChange={(e) => setTreeCover(e.target.value)}
        error={errors.tree_cover_percentage}
      />

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
            <span
              className="w-4 h-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin"
              aria-hidden="true"
            />
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                save
              </span>
              {initial ? 'Save Changes' : 'Add Measurement'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
