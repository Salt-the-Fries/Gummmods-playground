# Gummmods Playground

**A visual modding workbench for Godot games.**

Gummmods Playground is a workbench for inspecting Godot Android packages, mapping resources, assembling visual mod recipes, experimenting with post-processing, and preparing portable mod bundles for compatible loaders.

## Current prototype · 0.3.0

- **Workbench overview** — APK import and navigation between tools.
- **APK Analyzer** — reads an Android APK's ZIP directory locally in the browser and detects likely Godot fingerprints.
- **PCK directory parser** — reads standalone Godot PCK format versions 2, 3, and 4; reports engine version, flags, file paths, sizes, MD5 values, and per-file encryption/removal/delta flags. CI also generates a real PCK with Godot 4.4.1's own `PCKPacker` and verifies its directory, payload offsets, and MD5.
- **Resource index** — searchable list of files discovered in parsed PCK directories, with extension-based resource type hints.
- **Block Studio** — visual recipe prototype.
- **Shader Lab** — visual post-processing preview.
- **Export Bench** — placeholder for future `.gmod` packaging.

## Run locally

```bash
npm install
npm run dev
```

## Analyzer boundaries

The analyzer runs in the browser and does not upload or modify the original APK. It reads the APK ZIP directory first and only decompresses standalone `.pck` entries, avoiding unnecessary extraction of unrelated game assets. PCK entries larger than 256 MB are skipped to protect browser memory. It does not yet carve PCK data embedded inside native libraries/executables, decrypt encrypted directories or file payloads, extract resource bytes, decompile scripts, or prove loader compatibility.

PCK paths and file metadata are treated as untrusted input and are bounds-checked before indexing. A GitHub Actions workflow type-checks/builds the app, generates an authentic PCK using the official Godot 4.4.1 headless engine, and runs parser regression tests against both generated and synthetic edge-case packs. Unsupported formats and encrypted directories are reported rather than guessed at. Filename-based Godot fingerprints are evidence, not proof of compatibility.

Runtime injection and mod installation must be handled only through a compatible loader. The project should never overwrite an original APK.

## Stack

React, TypeScript, Vite, Lucide icons, and browser-side ZIP inspection with fflate.

## Format references

- [Godot PCK reader](https://github.com/godotengine/godot/blob/master/core/io/file_access_pack.cpp)
- [Godot PCK writer](https://github.com/godotengine/godot/blob/master/core/io/pck_packer.cpp)
- [Godot resource pack documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_pcks.html)
