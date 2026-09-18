import { useEffect, useMemo, useState } from 'react';
import type { Feature, Polygon } from 'geojson';
import { Modal } from '../Modal/Modal';
import { DrawMap } from './DrawMap';
import { computeGeometrySummary, toGeoJSONPolygon, type GeometrySummary } from './geometryUtils';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import { getApiErrorMessage } from '../../services/apiError';
import type { Site } from '../../types/dashboard';

type StepKey = 'project' | 'name' | 'draw' | 'review' | 'save';

const STEP_LABELS: Record<StepKey, string> = {
  project: 'Select Project',
  name: 'Site Name',
  draw: 'Draw Boundary',
  review: 'Review Geometry',
  save: 'Save Site',
};

// Edit mode skips "Select Project" — a site's project assignment isn't
// editable here (out of scope for a boundary/name edit), so re-showing
// that step would just be a disabled no-op control.
const CREATE_STEPS: StepKey[] = ['project', 'name', 'draw', 'review', 'save'];
const EDIT_STEPS: StepKey[] = ['name', 'draw', 'review', 'save'];

interface AddSiteFlowProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional extra hook (e.g. re-selecting the new site on a map) — the site is always added to `siteStore` regardless. */
  onCreated?: (site: Site) => void;
  /** Pre-select a project (e.g. when launched from a Project Detail page). */
  defaultProjectId?: string;
  /**
   * When provided, the flow runs in "edit" mode: it pre-fills the site's
   * current name/description/boundary, skips the project-selection step
   * (a site's project isn't reassignable here), and calls
   * `siteStore.updateSite` instead of `addSite` on save. Nothing is
   * persisted until the user reaches the final step and clicks
   * Save — dragging vertices or editing the name beforehand never
   * touches the backend, and clicking Cancel/closing the modal discards
   * the in-progress edit entirely, leaving the previously saved site
   * untouched.
   */
  site?: Site | null;
  /** Fired after a successful edit-mode save, with the updated site. */
  onUpdated?: (site: Site) => void;
}

/**
 * Add/Edit Site wizard: select project (create only) -> name the site ->
 * draw the boundary with Mapbox GL Draw -> review geometry (a live
 * Turf.js preview of area/perimeter/centroid) -> save. Only the raw
 * GeoJSON polygon is sent to FastAPI (`siteService.createSite`/
 * `updateSite`) — the backend recomputes area/perimeter/centroid
 * authoritatively from the PostGIS geometry, so the saved site's figures
 * may differ very slightly from this preview.
 */
export function AddSiteFlow({
  isOpen,
  onClose,
  onCreated,
  defaultProjectId,
  site,
  onUpdated,
}: AddSiteFlowProps) {
  const isEditMode = Boolean(site);
  const steps = isEditMode ? EDIT_STEPS : CREATE_STEPS;
  const addSite = useSiteStore((state) => state.addSite);
  const updateSite = useSiteStore((state) => state.updateSite);
  const { projects, fetchProjects } = useProjectStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [projectId, setProjectId] = useState(site?.project_id ?? defaultProjectId ?? '');
  const [siteName, setSiteName] = useState(site?.name ?? '');
  const [description, setDescription] = useState(site?.description ?? '');
  const [polygonFeature, setPolygonFeature] = useState<Feature<Polygon> | null>(null);
  const [summary, setSummary] = useState<GeometrySummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const step = steps[stepIndex];

  // The site's existing geometry, converted once to a Feature so it can
  // be handed to DrawMap as its starting boundary in edit mode.
  const initialFeature = useMemo<Feature<Polygon> | null>(() => {
    if (!site) return null;
    return { type: 'Feature', properties: {}, geometry: site.geometry };
  }, [site]);

  // The project picker must reflect projects actually persisted to the
  // backend (including ones just created via ProjectForm this session),
  // not a static mock array — fetch once when the flow opens.
  useEffect(() => {
    if (isOpen) fetchProjects();
  }, [isOpen, fetchProjects]);

  const reset = () => {
    setStepIndex(0);
    setProjectId(site?.project_id ?? defaultProjectId ?? '');
    setSiteName(site?.name ?? '');
    setDescription(site?.description ?? '');
    setPolygonFeature(null);
    setSummary(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePolygonChange = (feature: Feature<Polygon> | null) => {
    setPolygonFeature(feature);
    setSummary(feature ? computeGeometrySummary(feature) : null);
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const canProceed = (): boolean => {
    if (step === 'project') return Boolean(projectId);
    if (step === 'name') return siteName.trim().length > 0;
    if (step === 'draw') return Boolean(polygonFeature);
    return true;
  };

  const handleSave = async () => {
    if (!polygonFeature || !summary) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (isEditMode && site) {
        const updated = await updateSite(site.id, {
          name: siteName.trim(),
          description: description.trim(),
          geometry: toGeoJSONPolygon(polygonFeature),
        });
        onUpdated?.(updated);
      } else {
        const created = await addSite({
          project_id: projectId,
          name: siteName.trim(),
          description: description.trim(),
          geometry: toGeoJSONPolygon(polygonFeature),
          status: 'In Review',
        });
        onCreated?.(created);
      }
      // Show a brief success state instead of closing immediately, so the
      // user gets clear confirmation the site (and its boundary) actually
      // persisted before the modal disappears.
      setSaveSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1400);
    } catch (error) {
      setSaveError(
        getApiErrorMessage(
          error,
          isEditMode
            ? 'Unable to save the site changes. Please try again.'
            : 'Unable to save the site boundary. Please try again.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Site' : 'Add Site'}
      widthClassName="max-w-2xl"
    >
      {/* Step indicator */}
      <div
        className="flex items-center gap-1 mb-space-lg"
        aria-label={`Step ${stepIndex + 1} of ${steps.length}: ${STEP_LABELS[step]}`}
      >
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full ${i <= stepIndex ? 'bg-surface-tint' : 'bg-surface-container-high'}`}
            />
          </div>
        ))}
      </div>
      <p className="font-label-technical text-label-micro text-surface-tint uppercase mb-space-md">
        Step {stepIndex + 1} of {steps.length} &middot; {STEP_LABELS[step]}
      </p>

      {step === 'project' && (
        <div className="flex flex-col gap-space-sm">
          <label
            htmlFor="add-site-project"
            className="font-body-sm text-body-sm font-medium text-on-surface"
          >
            Select the project this site belongs to
          </label>
          <select
            id="add-site-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-outline-variant px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
          >
            <option value="">Choose a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="font-label-technical text-label-micro text-on-surface-variant">
              No projects yet — create a project first before adding a site.
            </p>
          )}
        </div>
      )}

      {step === 'name' && (
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="add-site-name"
              className="font-body-sm text-body-sm font-medium text-on-surface"
            >
              Site Name
            </label>
            <input
              id="add-site-name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Western Ghats — Site C"
              className="w-full rounded-lg border border-outline-variant px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="add-site-description"
              className="font-body-sm text-body-sm font-medium text-on-surface"
            >
              Description (optional)
            </label>
            <textarea
              id="add-site-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this site…"
              className="w-full rounded-lg border border-outline-variant px-space-md py-space-sm font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint resize-none"
            />
          </div>
        </div>
      )}

      {step === 'draw' && (
        <div className="flex flex-col gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {isEditMode
              ? 'Adjust the site boundary or draw a new one. Nothing is saved until you confirm on the final step.'
              : 'Draw the site boundary directly on the map.'}
          </p>
          <DrawMap
            onPolygonChange={handlePolygonChange}
            className="h-[360px] md:h-[420px]"
            initialFeature={initialFeature}
          />
          {!polygonFeature && (
            <p className="font-label-technical text-label-micro text-on-surface-variant">
              No boundary drawn yet — draw a polygon to continue.
            </p>
          )}
        </div>
      )}

      {step === 'review' && summary && (
        <div className="flex flex-col gap-space-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Review the calculated geometry before saving. These figures are an estimate computed
            from your drawn boundary — the exact saved values are calculated by the server.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <div className="p-space-md bg-surface-container-low rounded-xl">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Area
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {summary.areaHectares.toLocaleString()} ha
              </span>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Perimeter
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {summary.perimeterKm.toLocaleString()} km
              </span>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Centroid
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {summary.centroid.lat}, {summary.centroid.lon}
              </span>
            </div>
          </div>
          <div className="p-space-md bg-surface-container-low rounded-xl">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block mb-1">
              Summary
            </span>
            <p className="font-body-sm text-body-sm text-on-surface">
              {isEditMode ? (
                <>
                  <span className="font-medium text-primary">{siteName}</span> will be updated with
                  this boundary.
                </>
              ) : (
                <>
                  <span className="font-medium text-primary">{siteName}</span> will be added to{' '}
                  <span className="font-medium text-primary">
                    {projects.find((p) => p.id === projectId)?.name ?? 'the selected project'}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {step === 'save' && (
        <div className="flex flex-col items-center text-center gap-space-md py-space-md">
          {isSaving ? (
            <>
              <span
                className="w-10 h-10 rounded-full border-3 border-surface-tint/30 border-t-surface-tint animate-spin"
                aria-hidden="true"
              />
              <p className="font-body-md text-body-md text-on-surface-variant">
                Saving site boundary…
              </p>
            </>
          ) : saveSuccess ? (
            <>
              <span
                className="material-symbols-outlined text-surface-tint text-[40px]"
                aria-hidden="true"
              >
                check_circle
              </span>
              <p className="font-headline-sm text-headline-sm text-primary">
                {isEditMode ? 'Site updated successfully!' : 'Site saved successfully!'}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                &ldquo;{siteName}&rdquo;{' '}
                {isEditMode
                  ? 'has been updated on the project and dashboard maps.'
                  : 'is now visible on the project and dashboard maps.'}
              </p>
            </>
          ) : saveError ? (
            <>
              <span className="material-symbols-outlined text-error text-[32px]" aria-hidden="true">
                error
              </span>
              <p className="font-body-md text-body-md text-error">{saveError}</p>
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined text-surface-tint text-[32px]"
                aria-hidden="true"
              >
                check_circle
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Ready to save. Click Save Site to persist this boundary.
              </p>
            </>
          )}
        </div>
      )}

      {!saveSuccess && (
        <div className="flex items-center justify-between mt-space-lg pt-space-md border-t border-outline-variant/30">
          <button
            type="button"
            onClick={stepIndex === 0 ? handleClose : goBack}
            className="px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span
                  className="w-4 h-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    save
                  </span>
                  Save Site
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
