# src/features/

One folder per feature (e.g. `auth/`). Each feature is scoped internally as:

```
features/<feature>/
  pages/        route-level screens for this feature
  components/   components used only within this feature
  hooks/        hooks used only within this feature (incl. React Query hooks)
  api/          API functions for this feature (see CLAUDE.md → API layer)
```

Nothing here is empty by design — folders are added as features are built. If something inside a
feature is needed by a second feature, promote it to the matching top-level `src/` folder
(`components/`, `hooks/`, `types/`), not left duplicated.
