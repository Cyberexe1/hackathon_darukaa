import { useEffect, useState } from 'react';
import type { Feature, Polygon } from 'geojson';
import { Modal } from '../Modal/Modal';
import { DrawMap } from './DrawMap';
import { computeGeometrySummary, toGeoJSONPolygon, type GeometrySummary } from './geometryUtils';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import { getApiErrorMessage } from '../../services/apiError';
import type { Site } from '../../types/dashboard';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: 'Select Project',
  2: 'Site Name',
  3: 'Draw Boundary',
  4: 'Review Geometry',
  5: 'Save Site',
};

interface AddSiteFlowProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional extra hook (e.g. re-selecting the new site on a map) — the site is always added to `siteStore` regardless. */
  onCreated?: (site: Site) => void;
  /** Pre-select a project (e.g. when launched from a Project Detail page). */
  defaultProjectId?: string;
}

/**
 * Five-step Add Site wizard: select project -> name the site -> draw the
 * boundary with Mapbox GL Draw -> review geometry (a live Turf.js preview
 * of area/perimeter/centroid) -> save. Only the raw GeoJSON polygon is
 * POSTed to FastAPI (`siteService.createSite`) — the backend recomputes
 * area/perimeter/centroid authoritatively from the PostGIS geometry, so
 * the saved site's figures may differ very slightly from this preview.
 */
export function AddSiteFlow({ isOpen, onClose, onCreated, defaultProjectId }: AddSiteFlowProps) {
  const addSite = useSiteStore((state) => state.addSite);
  const { projects, fetchProjects } = useProjectStore();
  const [step, setStep] = useState<Step>(1);
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('');
  const [polygonFeature, setPolygonFeature] = useState<Feature<Polygon> | null>(null);
  const [summary, setSummary] = useState<GeometrySummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The project picker must reflect projects actually persisted to the
  // backend (including ones just created via ProjectForm this session),
  // not a static mock array — fetch once when the flow opens.
  useEffect(() => {
    if (isOpen) fetchProjects();
  }, [isOpen, fetchProjects]);

  const reset = () => {
    setStep(1);
    setProjectId(defaultProjectId ?? '');
    setSiteName('');
    setDescription('');
    setPolygonFeature(null);
    setSummary(null);
    setSaveError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePolygonChange = (feature: Feature<Polygon> | null) => {
    setPolygonFeature(feature);
    setSummary(feature ? computeGeometrySummary(feature) : null);
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 5) as Step);
  const goBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const canProceed = (): boolean => {
    if (step === 1) return Boolean(projectId);
    if (step === 2) return siteName.trim().length > 0;
    if (step === 3) return Boolean(polygonFeature);
    return true;
  };

  const handleSave = async () => {
    if (!polygonFeature || !summary) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await addSite({
        project_id: projectId,
        name: siteName.trim(),
        description: description.trim(),
        geometry: toGeoJSONPolygon(polygonFeature),
        status: 'In Review',
      });
      onCreated?.(created);
      handleClose();
    } catch (error) {
      setSaveError(
        getApiErrorMessage(error, 'Unable to save the site boundary. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Site" widthClassName="max-w-2xl">
      {/* Step indicator */}
      <div
        className="flex items-center gap-1 mb-space-lg"
        aria-label={`Step ${step} of 5: ${STEP_LABELS[step]}`}
      >
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full ${s <= step ? 'bg-surface-tint' : 'bg-surface-container-high'}`}
            />
          </div>
        ))}
      </div>
      <p className="font-label-technical text-label-micro text-surface-tint uppercase mb-space-md">
        Step {step} of 5 &middot; {STEP_LABELS[step]}
      </p>

      {step === 1 && (
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

      {step === 2 && (
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

      {step === 3 && (
        <div className="flex flex-col gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Draw the site boundary directly on the map. Use the polygon tool to place vertices.
          </p>
          <DrawMap onPolygonChange={handlePolygonChange} className="h-[360px] md:h-[420px]" />
          {!polygonFeature && (
            <p className="font-label-technical text-label-micro text-on-surface-variant">
              No boundary drawn yet — draw a polygon to continue.
            </p>
          )}
        </div>
      )}

      {step === 4 && summary && (
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
              <span className="font-medium text-primary">{siteName}</span> will be added to{' '}
              <span className="font-medium text-primary">
                {projects.find((p) => p.id === projectId)?.name ?? 'the selected project'}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {step === 5 && (
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

      <div className="flex items-center justify-between mt-space-lg pt-space-md border-t border-outline-variant/30">
        <button
          type="button"
          onClick={step === 1 ? handleClose : goBack}
          className="px-space-lg py-space-sm rounded-lg font-headline-sm text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 5 ? (
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
    </Modal>
  );
}
