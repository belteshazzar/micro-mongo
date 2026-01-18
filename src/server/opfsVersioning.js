const VERSION_METADATA_SUFFIX = '.version.json';
const VERSION_SUFFIX = '.v';

export const DEFAULT_COMPACTION_MIN_BYTES = 16 * 1024;

function buildVersionedPath(basePath, version) {
  const numericVersion = Number(version);
  if (!Number.isFinite(numericVersion)) {
    throw new Error(`Invalid version value: ${version}`);
  }
  if (numericVersion < 0) {
    throw new Error(`Version must be non-negative: ${numericVersion}`);
  }
  if (numericVersion === 0) {
    return basePath;
  }
  return `${basePath}${VERSION_SUFFIX}${numericVersion}`;
}

function normalizeMetadata(data) {
  const metadata = { currentVersion: 0, refCounts: {} };
  if (!data || typeof data !== 'object') return metadata;

  const version = Number(data.currentVersion);
  metadata.currentVersion = Number.isFinite(version) ? version : 0;

  if (data.refCounts && typeof data.refCounts === 'object') {
    for (const [key, value] of Object.entries(data.refCounts)) {
      const count = Number(value);
      if (Number.isFinite(count) && count > 0) {
        metadata.refCounts[String(key)] = count;
      } else if (!Number.isFinite(count) || count < 0) {
        console.warn(`Ignoring invalid ref count for version ${key}: ${value}`);
      }
    }
  }

  return metadata;
}

function splitPath(filePath) {
  const parts = filePath.split('/').filter(Boolean);
  const filename = parts.pop();
  if (!filename) {
    throw new Error(`Invalid storage path: ${filePath}`);
  }
  return { parts, filename };
}

async function getDirectoryHandle(pathParts, create) {
  let dir = await globalThis.navigator.storage.getDirectory();
  for (const part of pathParts) {
    dir = await dir.getDirectoryHandle(part, { create });
  }
  return dir;
}

async function ensureDirectoryForFile(filePath) {
  const { parts } = splitPath(filePath);
  if (parts.length === 0) return;
  await getDirectoryHandle(parts, true);
}

async function getFileHandle(filePath, { create } = {}) {
  const { parts, filename } = splitPath(filePath);
  const dir = await getDirectoryHandle(parts, !!create);
  return dir.getFileHandle(filename, { create });
}

async function readMetadata(basePath) {
  const metadataPath = `${basePath}${VERSION_METADATA_SUFFIX}`;
  try {
    const fileHandle = await getFileHandle(metadataPath, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text || text.trim() === '') {
      return normalizeMetadata();
    }
    return normalizeMetadata(JSON.parse(text));
  } catch (error) {
    if (error?.name === 'NotFoundError' || error?.code === 'ENOENT') {
      return normalizeMetadata();
    }
    throw error;
  }
}

async function writeMetadata(basePath, metadata) {
  const metadataPath = `${basePath}${VERSION_METADATA_SUFFIX}`;
  await ensureDirectoryForFile(metadataPath);
  const fileHandle = await getFileHandle(metadataPath, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(metadata));
  await writable.close();
}

async function deleteVersionedFiles(basePath, version, suffixes) {
  const versionedBase = buildVersionedPath(basePath, version);
  for (const suffix of suffixes) {
    const filePath = suffix ? `${versionedBase}${suffix}` : versionedBase;
    await removeFile(filePath);
  }
}

async function cleanupVersionIfUnreferenced(basePath, version, metadata, suffixes) {
  if (version === metadata.currentVersion) return;
  const key = String(version);
  if (metadata.refCounts[key]) return;
  await deleteVersionedFiles(basePath, version, suffixes);
}

export async function acquireVersionedPath(basePath) {
  const metadata = await readMetadata(basePath);
  const currentVersion = metadata.currentVersion;
  const key = String(currentVersion);
  metadata.refCounts[key] = (metadata.refCounts[key] || 0) + 1;
  await writeMetadata(basePath, metadata);
  return {
    version: currentVersion,
    path: buildVersionedPath(basePath, currentVersion)
  };
}

export async function releaseVersionedPath(basePath, version, { suffixes = [''] } = {}) {
  const metadata = await readMetadata(basePath);
  const key = String(version);
  if (metadata.refCounts[key]) {
    metadata.refCounts[key] -= 1;
    if (metadata.refCounts[key] <= 0) {
      delete metadata.refCounts[key];
    }
  }
  await cleanupVersionIfUnreferenced(basePath, version, metadata, suffixes);
  await writeMetadata(basePath, metadata);
}

export async function promoteVersion(basePath, newVersion, oldVersion, { suffixes = [''] } = {}) {
  const metadata = await readMetadata(basePath);
  const nextVersion = Number(newVersion);
  metadata.currentVersion = Number.isFinite(nextVersion) ? nextVersion : metadata.currentVersion;
  const key = String(metadata.currentVersion);
  if (!metadata.refCounts[key]) {
    metadata.refCounts[key] = 0;
  }
  await cleanupVersionIfUnreferenced(basePath, oldVersion, metadata, suffixes);
  await writeMetadata(basePath, metadata);
}

export async function getCurrentVersion(basePath) {
  const metadata = await readMetadata(basePath);
  return metadata.currentVersion;
}

export async function removeFile(filePath) {
  try {
    const { parts, filename } = splitPath(filePath);
    const dir = await getDirectoryHandle(parts, false);
    await dir.removeEntry(filename);
  } catch (error) {
    if (error?.name === 'NotFoundError' || error?.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

export async function createSyncAccessHandle(filePath, { reset = false } = {}) {
  if (reset) {
    await removeFile(filePath);
  }
  await ensureDirectoryForFile(filePath);
  const fileHandle = await getFileHandle(filePath, { create: true });
  return fileHandle.createSyncAccessHandle();
}

export { buildVersionedPath };
