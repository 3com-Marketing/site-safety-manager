

# Fix: App stuck on "Cargando..."

## Root Cause
Race condition in `src/lib/auth.tsx`:
1. `getSession()` calls `fetchRoles()` without `await`, then immediately sets `loading = false`
2. The app renders with `role = null` and redirects to login or shows empty state
3. `await` inside `onAuthStateChange` can block/deadlock auth events

## Fix in `src/lib/auth.tsx`
- Remove the `onAuthStateChange` handler from setting loading state and fetching roles (it causes duplicated logic and deadlocks)
- Use `onAuthStateChange` only to react to sign-in/sign-out events after initial load
- In `getSession`, properly `await` the role fetch before setting `loading = false`
- Avoid awaiting Supabase calls inside `onAuthStateChange` — use setTimeout or fire-and-forget pattern

Revised approach:
```
useEffect(() => {
  let mounted = true;

  // 1. Initial session restore
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!mounted) return;
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchRoles(session.user.id);
    }
    setLoading(false);  // Only after roles are loaded
  });

  // 2. Listen for future changes (sign-in, sign-out, token refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Don't await — fire and forget to avoid deadlock
        fetchRoles(session.user.id);
      } else {
        setRole(null);
        setRoles([]);
      }
    }
  );

  return () => { mounted = false; subscription.unsubscribe(); };
}, []);
```

## No other files need changes
The `Index.tsx`, `RoleSwitcher.tsx`, and `App.tsx` already work correctly with the auth context — the issue is purely the loading/role race.

