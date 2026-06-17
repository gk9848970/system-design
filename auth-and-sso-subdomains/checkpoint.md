# Checkpoints

## Auth and SSO for Subdomains

### Single Cookie - SSO

1. UI with Login + Logout button
2. Log in on trade.lvh.me
3. Go to portfolio.lvh.me → already logged in (didn't log in there)
4. Log out on trade.lvh.me
5. Reload portfolio.lvh.me → logged out too
6. Auto refresh: /refresh re-sets the same cookie on a timer by itself

### Split the single cookie into two (Access and Refresh)

1. Two cookies: access (Path=/, short-lived) + refresh (Path=/refresh, long-lived)
2. Centralized apiFetch with refresh on access expire
