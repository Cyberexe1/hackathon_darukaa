export interface NotificationItem {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
}

// Lightweight local/mock notification feed. No real-time infrastructure —
// this is static demo state for the notification dropdown.
export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    message: 'Site A boundary successfully saved.',
    created_at: '2026-09-16T08:12:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    message: 'Western Ghats — Site A was updated.',
    created_at: '2026-09-15T13:40:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    message: 'New project "Urban Biodiversity" created.',
    created_at: '2026-09-10T09:15:00Z',
    read: true,
  },
  {
    id: 'notif-4',
    message: 'Analytics data updated for Sundarbans — Site A.',
    created_at: '2026-09-08T11:00:00Z',
    read: true,
  },
];
