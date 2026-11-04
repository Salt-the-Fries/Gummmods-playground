import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGodotPck } from '../src/lib/pck.ts';

function makePck({ flags = 2, fileOffset = 0, size = 3, formatVersion = 3 } = {}) {
  const path = new TextEncoder().encode('res://icon.png');
  const paddedLength = Math.ceil(path.length / 4) * 4;
  const directoryOffset = 144;
  const fileBase = 128;
  const bytes = new Uint8Array(directoryOffset + 4 + 4 + paddedLength + 8 + 8 + 16 + 4);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, 0x43504447, true); // GDPC
  view.setUint32(4, formatVersion, true);
  view.setUint32(8, 4, true);
  view.setUint32(12, 3, true);
  view.setUint32(16, 1, true);
  view.setUint32(20, flags, true);
  view.setBigUint64(24, BigInt(fileBase), true);
  view.setBigUint64(32, BigInt(directoryOffset), true);
  view.setUint32(directoryOffset, 1, true);

  let cursor = directoryOffset + 4;
  view.setUint32(cursor, paddedLength, true);
  cursor += 4;
  bytes.set(path, cursor);
  cursor += paddedLength;
  view.setBigUint64(cursor, BigInt(fileOffset), true);
  cursor += 8;
  view.setBigUint64(cursor, BigInt(size), true);
  cursor += 8;
  cursor += 16; // zeroed MD5
  view.setUint32(cursor, 0, true);
  bytes.set([1, 2, 3], fileBase);
  return bytes;
}

test('indexes a Godot 4.x PCK directory and classifies resources', () => {
  const result = parseGodotPck(makePck());
  assert.equal(result.formatVersion, 3);
  assert.equal(result.engineVersion, '4.3.1');
  assert.equal(result.fileCount, 1);
  assert.equal(result.entries[0].path, 'res://icon.png');
  assert.equal(result.entries[0].offset, 128);
  assert.equal(result.entries[0].size, 3);
  assert.equal(result.entries[0].kind, 'Texture');
});

test('rejects encrypted directory metadata instead of guessing', () => {
  assert.throws(() => parseGodotPck(makePck({ flags: 3 })), /encrypted directory/i);
});

test('rejects unsupported PCK format versions', () => {
  assert.throws(() => parseGodotPck(makePck({ formatVersion: 9 })), /not supported/i);
});

test('does not treat sparse-bundle payload offsets as local PCK offsets', () => {
  const result = parseGodotPck(makePck({ flags: 6, size: 900_000 }));
  assert.equal(result.fileCount, 1);
  assert.ok(result.warnings.some(warning => warning.includes('Sparse bundle')));
});

test('rejects out-of-bounds ordinary resource payloads', () => {
  assert.throws(() => parseGodotPck(makePck({ size: 900_000 })), /data bounds/i);
});
