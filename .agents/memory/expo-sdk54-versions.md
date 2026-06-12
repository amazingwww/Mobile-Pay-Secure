---
name: Expo SDK 54 package versions and Metro pitfalls
description: Correct package versions for Expo SDK 54 / expo-router 6 and packages that crash Metro in pnpm
---

**Never install with latest semver for these packages — always pin to the SDK 54 catalog:**
- `expo-notifications` → `~0.32.17` (not `56.x`)
- `expo-local-authentication` → `~17.0.8` (not `56.x`)
- `expo-device` → `~8.0.10` (not `56.x`)

**Packages that crash Metro in this pnpm monorepo:**
- `expo-media-library` (any version) — Metro throws `ENOENT: no such file or directory, watch .../expo-media-library_tmp_*/android/src/main`. Do not install it. Use `expo-sharing` alone for sharing files.

**Why:** pnpm creates temp directories during install that Metro tries to watch. The temp dir is cleaned up before Metro starts, causing the ENOENT crash.

**How to apply:** When adding an Expo package, first check `pnpm-workspace.yaml` catalog or run `pnpm dlx expo install <pkg>` (which respects the SDK version manifest) rather than `pnpm add <pkg>`.

**view-shot web:** `react-native-view-shot` has no web support. Use dynamic `require()` inside a `Platform.OS !== 'web'` guard with a try/catch so `captureRef` stays null on web and the share button falls back to `Alert` instead.
