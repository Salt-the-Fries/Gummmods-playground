# Gummmods Playground

**A visual modding workbench for Godot games.**

The repository and product workspace are named **Gummmods Playground**. It is a playground for inspecting Godot Android packages, exploring resources, assembling visual mod recipes, experimenting with post-processing, and preparing portable mod bundles for compatible loaders.

## Current prototype

- **Workbench overview** — APK import and navigation between tools.
- **APK Analyzer** — reads an Android APK's ZIP directory locally in the browser, looks for Godot filename fingerprints, and lists archive entries with search.
- **Asset Browser** — starter section for extracted game resources.
- **Block Studio** — visual recipe prototype.
- **Shader Lab** — visual post-processing preview.
- **Export Bench** — placeholder for future `.gmod` packaging.

## Run locally

```bash
npm install
npm run dev
```

## APK Analyzer scope

The analyzer currently reads the APK ZIP directory using `fflate`. It does not upload or modify the original file. Godot fingerprints are filename hints, not a compatibility guarantee. Embedded PCK parsing, decryption handling, resource extraction, script analysis, and loader compatibility checks are not implemented yet.

Runtime injection and mod installation must be handled only through a compatible loader. The project should never overwrite an original APK.

## Stack

React, TypeScript, Vite, Lucide icons, and browser-side ZIP inspection.
