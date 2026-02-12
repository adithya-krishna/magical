# Settings Page AGENT

## Goal
Provide per-user settings for profile updates, notification preferences, and system/session preferences.

## Access (RBAC)
- All authenticated users can access their own settings.
- Users can only update their own settings.

## UI scope
- Profile settings (name, phone, avatar).
- Notification preferences (in-app toggles by category).
- System preferences (theme, time zone, time format, week start day).
- Session preferences (auto-logout timeout, remember last page).

## Data model (suggested)
UserSettings
- id (uuid)
- userId (uuid)
- timeZone (string, default: system)
- timeFormat (enum: 12h, 24h)
- weekStart (enum: mon, sun)
- theme (enum: light, dark, system)
- rememberLastPage (boolean, default true)
- autoLogoutMinutes (int, optional)
- createdAt, updatedAt

NotificationPreference
- id (uuid)
- userId (uuid)
- type (string)
- channel (enum: in_app)
- enabled (boolean)

## API endpoints (v1)
Settings
- GET `/api/v1/settings/me`
- PATCH `/api/v1/settings/me`

Profile
- GET `/api/v1/users/me`
- PATCH `/api/v1/users/me`

Notification preferences
- GET `/api/v1/notification-preferences`
- PATCH `/api/v1/notification-preferences`

## Validation rules
- autoLogoutMinutes must be between 5 and 1440 if set.
- timeZone must be valid IANA time zone.
- theme must be one of light/dark/system.

## FE behaviors
- Settings are scoped to the current user only.
- Changes are applied immediately and persisted server-side.
- Theme updates should update the UI without full reload.
- Time zone affects all date/time rendering across pages.

## Notes
- Notification preferences are in-app only for v1.
