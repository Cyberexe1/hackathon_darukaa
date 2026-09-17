// Shared type definitions for the Darukaa.Earth landing page.
// These describe the shape of the illustrative/preview data used across
// the marketing site (platform preview, analytics preview, site registry).
// They intentionally mirror the data model the real dashboard will use
// later (Project -> Site -> metrics) without wiring up any backend calls.

export interface HeroMetric {
  label: string;
  value: string;
  counterTarget?: number;
}

export interface ValuePillar {
  icon: string;
  title: string;
  description: string;
}

export interface SiteMetric {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
}

export interface SiteRegistryRow {
  name: string;
  coordinates: string;
  area: string;
  carbon: string;
  biodiversity: string;
  status: 'Active' | 'Verified' | 'In Review';
}

export interface WorkflowStep {
  index: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  tag: string;
}

export interface TechBadge {
  name: string;
  subtitle: string;
}

export interface SecurityFeature {
  title: string;
  description: string;
}
