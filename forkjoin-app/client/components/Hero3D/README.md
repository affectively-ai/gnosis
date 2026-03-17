# Hero3D

## Key Files

| File | Size |
|------|------|
| `HeroScene.tsx` | 14.9 KB |
| `LazyHeroCanvas.tsx` | 0.9 KB |

## Runtime Performance Guards

- The scene avoids per-frame React state writes inside `useFrame`; color animation is material-mutation only.
- Geometry and particle counts are intentionally capped to reduce dropped frames on mid-range devices.
- Canvas boot is deferred from the critical path; the static hero remains visible until user intent/late fallback.
