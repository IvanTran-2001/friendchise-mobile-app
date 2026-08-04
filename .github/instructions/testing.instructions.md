# Testing and Migration Instructions

Use these rules when validating changes, running package commands, or working with Prisma and seeds.

## Validation Strategy

- Validate the smallest affected surface first.
- Prefer a targeted check over a broad project-wide command when only one screen, hook, or component changed.
- If a fix touches one route or feature slice, run the narrowest command that covers that slice before broader checks.
- If a change spans multiple layers, validate the most failure-prone layer first and expand only if needed.

## Package Commands

- `pnpm start` runs the Expo dev server.
- `pnpm android` opens the app on Android through Expo.
- `pnpm ios` opens the app on iOS through Expo.
- `pnpm web` runs the web preview through Expo.
- `pnpm typecheck` runs the TypeScript compiler with no emit.
- `pnpm lint` runs ESLint.

## Prisma Migrations

- This repository currently does not expose Prisma migration scripts in `package.json`.
- If Prisma or seed tooling is added later, document the exact commands here before relying on them.

## Seed Work

- If seed tooling is added later, keep it consistent with the repository's existing folder structure and document the command here.
- If a seed script depends on local environment variables, load the env first before running it.
- Validate seed changes with the smallest applicable script or lint check before wider verification.

## Example Behavior

Good:

```text
This change only touches the task action, so run the task unit tests first before anything broader.
```

Good:

```text
For a Prisma schema change, use the repository migration workflow instead of hand-editing generated output.
```

Good:

```text
This seed utility reads local env values, so load the environment before running it.
```

Bad:

```text
Always run the entire test suite for every tiny change.
```

Bad:

```text
Treat schema updates like ordinary code and skip migration validation.
```