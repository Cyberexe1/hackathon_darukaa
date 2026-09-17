import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { SignInPage } from './pages/SignIn/SignInPage';
import { SignUpPage } from './pages/SignUp/SignUpPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';

// The authenticated dashboard pulls in Mapbox GL, Mapbox Draw, Highcharts,
// and Turf.js — none of which the public landing/auth pages need. Lazy
// loading these keeps the public bundle light and only fetches the heavy
// geospatial/analytics chunks once a signed-in user actually navigates in.
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetail/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
);
const SitesPage = lazy(() => import('./pages/Sites/SitesPage').then((m) => ({ default: m.SitesPage })));
const SiteAnalyticsPage = lazy(() =>
  import('./pages/SiteAnalytics/SiteAnalyticsPage').then((m) => ({ default: m.SiteAnalyticsPage })),
);
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span
        className="w-10 h-10 rounded-full border-3 border-surface-tint/30 border-t-surface-tint animate-spin"
        aria-hidden="true"
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<DashboardFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Authenticated dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites"
            element={
              <ProtectedRoute>
                <SitesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites/:siteId"
            element={
              <ProtectedRoute>
                <SiteAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
