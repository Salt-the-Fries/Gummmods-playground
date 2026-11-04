export type GodotPckEntry = {
  path: string;
  size: number;
  offset: number;
  md5: string;
  encrypted: boolean;
  removal: boolean;
  delta: boolean;
  extension: string;
  kind: string;
};

export type GodotPckInfo = {
  formatVersion: number;
  engineVersion: string;
  flags: number;
  fileCount: number;
  fileBase: number;
  directoryOffset: number;
  directoryEncrypted: boolean;
  entries: GodotPckEntry[];
  warnings: string[];
};

const MAGIC = 0x43504447; // "GDPC" as a little-endian uint32.
const MAX_ENTRIES = 500_000;
const MAX_PATH_BYTES = 1_048_576;

function requireRange(offset: number, length: number, limit: number, label: string) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > limit) {
    throw new Error(`Invalid PCK ${label} bounds.`);
  }
}

function readU32(view: DataView, offset: number, limit: number, label: string) {
  requireRange(offset, 4, limit, label);
  return view.getUint32(offset, true);
}

function readU64(view: DataView, offset: number, limit: number, label: string) {
  requireRange(offset, 8, limit, label);
  const value = view.getBigUint64(offset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`PCK ${label} exceeds the safe browser integer range.`);
  return Number(value);
}

function classify(path: string) {
  const ext = path.includes(".") ? path.split(".").pop()!.toLowerCase() : "";
  const kinds: Record<string, string> = {
    png: "Texture", jpg: "Texture", jpeg: "Texture", webp: "Texture", svg: "Vector image",
    tscn: "Scene", scn: "Compiled scene", tres: "Resource", res: "Compiled resource",
    gd: "GDScript", gdc: "Compiled GDScript", gde: "Encrypted script",
    shader: "Shader", gdshader: "Shader", wav: "Audio", ogg: "Audio", mp3: "Audio",
    import: "Import metadata", cfg: "Configuration", json: "Data", txt: "Text",
    translation: "Translation", font: "Font", ttf: "Font", otf: "Font",
    glb: "3D model", gltf: "3D model", obj: "3D model", mesh: "Mesh",
  };
  return { extension: ext || "file", kind: kinds[ext] || "Other resource" };
}

/**
 * Reads the directory of a standalone Godot PCK (format versions 2–4).
 * It never executes or decrypts game content. Encrypted directories are reported
 * as unsupported rather than guessed at.
 */
export function parseGodotPck(bytes: Uint8Array): GodotPckInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const limit = bytes.byteLength;
  if (limit < 32) throw new Error("This file is too small to contain a Godot PCK header.");
  if (readU32(view, 0, limit, "magic") !== MAGIC) throw new Error('Godot PCK magic "GDPC" was not found at the start of this file.');

  const formatVersion = readU32(view, 4, limit, "format version");
  if (![2, 3, 4].includes(formatVersion)) {
    throw new Error(`PCK format version ${formatVersion} is not supported yet (supported: 2, 3, 4).`);
  }

  const major = readU32(view, 8, limit, "engine major");
  const minor = readU32(view, 12, limit, "engine minor");
  const patch = readU32(view, 16, limit, "engine patch");
  const flags = readU32(view, 20, limit, "pack flags");
  const directoryEncrypted = (flags & 1) !== 0;
  const relativeFileBase = (flags & 2) !== 0;
  const sparseBundle = (flags & 4) !== 0;

  let cursor = 24;
  let fileBase = readU64(view, cursor, limit, "file base");
  cursor += 8;
  let directoryOffset = 0;

  if (formatVersion >= 3) {
    directoryOffset = readU64(view, cursor, limit, "directory offset");
    cursor += 8;
    if (formatVersion === 4 && sparseBundle && directoryEncrypted) {
      requireRange(cursor, 32, limit, "directory salt");
      cursor += 32;
    }
    // V3/V4 offsets are relative to the beginning of this PCK.
    fileBase += 0;
    cursor = directoryOffset;
  } else {
    if (relativeFileBase) fileBase += 0;
    // V2 stores sixteen reserved uint32 values before its directory.
    requireRange(cursor, 64, limit, "reserved header");
    cursor += 64;
    directoryOffset = cursor;
  }

  if (directoryEncrypted) {
    throw new Error("This PCK has an encrypted directory. The pack is recognized, but listing its files requires the game's authorized export key.");
  }

  const count = readU32(view, cursor, limit, "file count");
  cursor += 4;
  if (count > MAX_ENTRIES) throw new Error(`PCK directory declares an unreasonable number of entries (${count}).`);

  const entries: GodotPckEntry[] = [];
  const warnings: string[] = [];
  for (let i = 0; i < count; i++) {
    const storedPathLength = readU32(view, cursor, limit, `entry ${i} path length`);
    cursor += 4;
    if (storedPathLength === 0 || storedPathLength > MAX_PATH_BYTES) {
      throw new Error(`PCK entry ${i} has an invalid path length.`);
    }
    requireRange(cursor, storedPathLength, limit, `entry ${i} path`);
    const pathBytes = bytes.subarray(cursor, cursor + storedPathLength);
    const path = new TextDecoder("utf-8", { fatal: false }).decode(pathBytes).replace(/\0+$/g, "");
    cursor += storedPathLength;

    const offset = readU64(view, cursor, limit, `entry ${i} offset`);
    cursor += 8;
    const size = readU64(view, cursor, limit, `entry ${i} size`);
    cursor += 8;
    requireRange(cursor, 16, limit, `entry ${i} MD5`);
    const md5 = Array.from(bytes.subarray(cursor, cursor + 16), b => b.toString(16).padStart(2, "0")).join("");
    cursor += 16;

    let entryFlags = 0;
    if (formatVersion >= 2) {
      entryFlags = readU32(view, cursor, limit, `entry ${i} flags`);
      cursor += 4;
    }

    const absoluteOffset = fileBase + offset;
    const encrypted = (entryFlags & 1) !== 0;
    const removal = (entryFlags & 2) !== 0;
    const delta = (entryFlags & 4) !== 0;
    const { extension, kind } = classify(path);

    if (!removal && !encrypted) {
      requireRange(absoluteOffset, size, limit, `entry ${i} data`);
    }
    if (removal) warnings.push(`Patch removal marker: ${path}`);
    if (encrypted) warnings.push(`Encrypted resource cannot be previewed: ${path}`);
    if (delta) warnings.push(`Delta-patched resource: ${path}`);

    entries.push({ path, size, offset: absoluteOffset, md5, encrypted, removal, delta, extension, kind });
  }

  if (sparseBundle) warnings.push("Sparse bundle detected: resource payloads may live outside this PCK file and are not validated here.");
  if (entries.length === 0) warnings.push("The PCK directory is valid but contains no entries.");
  return {
    formatVersion,
    engineVersion: `${major}.${minor}.${patch}`,
    flags,
    fileCount: entries.length,
    fileBase,
    directoryOffset,
    directoryEncrypted,
    entries,
    warnings: [...new Set(warnings)],
  };
}
