import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: 'project' | 'site';
  path: string;
}

interface GlobalSearchProps {
  autoFocus?: boolean;
  onNavigate?: () => void;
}

/**
 * Lightweight client-side search across the real projects and sites
 * cached in `projectStore`/`siteStore`. Matches by name substring
 * (case-insensitive) and navigates to the relevant detail route on
 * selection.
 */
export function GlobalSearch({ autoFocus, onNavigate }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sites = useSiteStore((state) => state.sites);
  const fetchSites = useSiteStore((state) => state.fetchSites);
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  useEffect(() => {
    fetchSites();
    fetchProjects();
  }, [fetchSites, fetchProjects]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const projectResults: SearchResult[] = projects
      .filter((p) => p.name.toLowerCase().includes(trimmed))
      .map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: `${p.project_type} · Project`,
        type: 'project',
        path: `/projects/${p.id}`,
      }));

    const siteResults: SearchResult[] = sites
      .filter((s) => s.name.toLowerCase().includes(trimmed))
      .map((s) => ({
        id: s.id,
        label: s.name,
        sublabel: `${s.area_hectares.toLocaleString()} ha · Site`,
        type: 'site',
        path: `/sites/${s.id}`,
      }));

    return [...projectResults, ...siteResults].slice(0, 8);
  }, [query, sites, projects]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    navigate(result.path);
    onNavigate?.();
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className="flex items-center gap-space-xs bg-surface-container-low rounded-full px-space-md py-space-xs">
        <span
          className="material-symbols-outlined text-[18px] text-on-surface-variant"
          aria-hidden="true"
        >
          search
        </span>
        <input
          type="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects & sites…"
          aria-label="Search projects and sites"
          className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
        />
      </div>

      {isOpen && query.trim() && (
        <div
          className="absolute left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden animate-scale-in origin-top z-50"
          role="listbox"
        >
          {results.length === 0 ? (
            <p className="px-space-md py-space-md font-body-sm text-body-sm text-on-surface-variant text-center">
              No projects or sites match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-space-md py-space-sm hover:bg-surface-container-low transition-colors flex items-center gap-space-sm"
                    role="option"
                  >
                    <span
                      className="material-symbols-outlined text-[18px] text-surface-tint shrink-0"
                      aria-hidden="true"
                    >
                      {result.type === 'project' ? 'forest' : 'pin_drop'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-body-sm text-body-sm text-on-surface truncate">
                        {result.label}
                      </p>
                      <p className="font-label-technical text-label-micro text-on-surface-variant truncate">
                        {result.sublabel}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
