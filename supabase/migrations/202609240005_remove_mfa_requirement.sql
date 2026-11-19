alter table public.admin_security_events
  drop constraint if exists admin_security_events_event_type_check;

alter table public.admin_security_events
  add constraint admin_security_events_event_type_check
  check (event_type in (
    'login_success',
    'login_failed',
    'login_rate_limited',
    'mfa_challenge_failed',
    'mfa_success',
    'logout',
    'logout_all',
    'sensitive_reauth',
    'password_reauth_success',
    'password_reauth_failed',
    'wedding_delete',
    'slug_change',
    'publish',
    'unpublish',
    'security_change'
  ));
