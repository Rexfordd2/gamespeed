const MANAGED_FOLDERS = [
  'sport-icons',
  'mode-icons',
  'target-skins',
  'hud-badges',
  'audio-cues',
];

const toPosix = value => value.replace(/\\/g, '/').replace(/^\/+/, '');

const getFileName = relativePath => {
  const normalized = toPosix(relativePath);
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? normalized;
};

const extensionOf = relativePath => {
  const fileName = getFileName(relativePath);
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return fileName.slice(dotIndex + 1).toLowerCase();
};

const indexById = entries =>
  entries.reduce((accumulator, entry) => {
    accumulator[entry.id] = entry;
    return accumulator;
  }, {});

const buildKnownFiles = assetMap => {
  const known = new Set();
  Object.values(assetMap.groups).forEach(entries => {
    entries.forEach(entry => {
      known.add(toPosix(entry.file));
      if (entry.fallbackFile) {
        known.add(toPosix(entry.fallbackFile));
      }
    });
  });
  return known;
};

const validateRequiredAssets = (assetMap, existingFiles, errors) => {
  Object.entries(assetMap.groups).forEach(([groupName, entries]) => {
    entries.forEach(entry => {
      if (!entry.required) return;
      const file = toPosix(entry.file);
      if (!existingFiles.has(file)) {
        errors.push(`[missing required] ${groupName}:${entry.id} -> ${file}`);
      }
    });
  });
};

const validateDuplicateIds = (assetMap, errors) => {
  Object.entries(assetMap.groups).forEach(([groupName, entries]) => {
    const seen = new Set();
    entries.forEach(entry => {
      if (seen.has(entry.id)) {
        errors.push(`[duplicate id] ${groupName}:${entry.id}`);
      }
      seen.add(entry.id);
    });
  });
};

const validateSupportedFileNames = (assetMap, existingFiles, errors, warnings) => {
  const fileNamePattern = new RegExp(assetMap.naming.fileNamePattern);
  const knownFiles = buildKnownFiles(assetMap);

  [...existingFiles].forEach(file => {
    const normalized = toPosix(file);
    const isManagedFile = MANAGED_FOLDERS.some(folder => normalized.startsWith(`${folder}/`));
    if (!isManagedFile) return;

    const fileName = getFileName(normalized);
    if (fileName.startsWith('.')) {
      return;
    }
    if (!fileNamePattern.test(fileName)) {
      errors.push(`[invalid file name] ${normalized}`);
      return;
    }

    const folder = normalized.split('/')[0];
    const extension = extensionOf(normalized);
    const formatsKey = {
      'sport-icons': 'sportIcons',
      'mode-icons': 'modeIcons',
      'target-skins': 'targetSkins',
      'hud-badges': 'hudBadges',
      'audio-cues': 'audioCues',
    }[folder];

    if (formatsKey) {
      const supported = assetMap.supportedFormats[formatsKey] ?? [];
      if (!supported.includes(extension)) {
        errors.push(`[unsupported format] ${normalized} (.${extension})`);
      }
    }

    if (!knownFiles.has(normalized)) {
      warnings.push(`[unmapped file] ${normalized}`);
    }
  });
};

const validateReferences = (assetMap, errors) => {
  const sportIconById = indexById(assetMap.groups.sportIcons);
  const targetSkinById = indexById(assetMap.groups.targetSkins);
  const modeIconById = indexById(assetMap.groups.modeIcons);
  const audioCueByKey = assetMap.groups.audioCues.reduce((accumulator, entry) => {
    accumulator[`${entry.channel}:${entry.cueKey}`] = entry;
    return accumulator;
  }, {});

  assetMap.sports.forEach(sport => {
    const sportIconId = assetMap.references.sportToSportIcon[sport];
    if (!sportIconId) {
      errors.push(`[missing sport reference] ${sport} has no sport icon reference`);
    } else if (!sportIconById[sportIconId]) {
      errors.push(`[missing sport reference] ${sport} -> unknown sport icon id "${sportIconId}"`);
    }

    const targetSkinId = assetMap.references.sportToTargetSkin[sport];
    if (!targetSkinId) {
      errors.push(`[missing sport reference] ${sport} has no target skin reference`);
    } else if (!targetSkinById[targetSkinId]) {
      errors.push(`[missing sport reference] ${sport} -> unknown target skin id "${targetSkinId}"`);
    }
  });

  assetMap.modes.forEach(mode => {
    const modeIconId = assetMap.references.modeToModeIcon[mode];
    if (!modeIconId) {
      errors.push(`[missing mode reference] ${mode} has no mode icon reference`);
    } else if (!modeIconById[modeIconId]) {
      errors.push(`[missing mode reference] ${mode} -> unknown mode icon id "${modeIconId}"`);
    }

    const cueRefs = assetMap.references.modeToAudioCues[mode];
    if (!Array.isArray(cueRefs)) {
      errors.push(`[missing mode reference] ${mode} has no mode audio cue list`);
      return;
    }

    cueRefs.forEach(cueKey => {
      if (!audioCueByKey[cueKey]) {
        errors.push(`[missing mode reference] ${mode} -> unknown audio cue "${cueKey}"`);
      }
    });
  });
};

export const validateAssetMap = ({ assetMap, existingFiles }) => {
  const errors = [];
  const warnings = [];
  const normalizedFiles = new Set([...existingFiles].map(toPosix));

  validateRequiredAssets(assetMap, normalizedFiles, errors);
  validateDuplicateIds(assetMap, errors);
  validateSupportedFileNames(assetMap, normalizedFiles, errors, warnings);
  validateReferences(assetMap, errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const managedAssetFolders = MANAGED_FOLDERS;
