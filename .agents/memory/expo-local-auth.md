---
name: expo-local-authentication web support
description: How to safely use expo-local-authentication in an Expo app that also runs on web
---

`expo-local-authentication` has no web build (no `web/` dir in the package). Importing it in a shared file crashes the web bundle.

**Fix:** Use platform-specific module files:
- `hooks/useBiometric.native.ts` — real implementation using `expo-local-authentication`
- `hooks/useBiometric.web.ts` — stub returning all-false defaults

Metro automatically picks the right file per platform. TypeScript sees whichever variant it resolves first (usually `.web.ts` alphabetically) but both files must export the same type signature.

**Why:** `import * as LocalAuthentication from 'expo-local-authentication'` at module level fails at bundle time on web — there is no dynamic import workaround that satisfies Metro's static analysis.

**How to apply:** Any `expo-*` package with no `web/` directory in node_modules needs this treatment.
