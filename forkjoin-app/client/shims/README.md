# Shims

Parent: [../README.md](../README.md)

## Files

- `aeon-flux-speculation.ts` - Local re-export of the runtime speculation module so the app can bundle prefetch behavior without importing the full router entrypoint.
- `aeon-flux-react-presence-kit.ts` - Local re-export of the PresenceKit surface used by the flight deck so the app does not pull the full `@affectively/aeon-flux-react` barrel into the client bundle.
- `react-jsx-dev-runtime.ts` - Production-safe compatibility layer for packages compiled against `react/jsx-dev-runtime`.
