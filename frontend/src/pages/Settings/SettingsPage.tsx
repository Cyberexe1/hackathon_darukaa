import { useAuthStore } from '../../store/authStore';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';

/** /settings — minimal account settings placeholder. */
export function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="p-4 md:p-space-lg max-w-[800px] mx-auto flex flex-col gap-space-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage your account and workspace preferences.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-md">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block mb-1">
                Name
              </span>
              <span className="font-body-md text-body-md text-on-surface">{user?.name ?? '—'}</span>
            </div>
            <div>
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block mb-1">
                Email
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user?.email ?? '—'}
              </span>
            </div>
            <div>
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block mb-1">
                Role
              </span>
              <span className="font-body-md text-body-md text-on-surface capitalize">
                {user?.role ?? '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm">
            About this demo
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Darukaa.Earth is currently running against a mock data layer with no backend connected.
            Project, site, and analytics data shown throughout the dashboard is synthetic demo data
            for illustration purposes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
