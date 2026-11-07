function loadLocalProfile(storage, key) {
  const raw = storage.getItem(key);
  if (raw === null) return null;

  let profile;
  try {
    profile = JSON.parse(raw);
  } catch {
    throw new Error("The saved profile is not valid JSON.");
  }
  if (!profile || typeof profile !== "object" || Array.isArray(profile) || typeof profile.name !== "string") {
    throw new Error("The saved profile has an unexpected format.");
  }
  return profile;
}

function saveLocalProfile(storage, key, profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile) || typeof profile.name !== "string") {
    throw new TypeError("A valid local profile is required.");
  }
  storage.setItem(key, JSON.stringify(profile));
}

function removeLocalProfile(storage, key) {
  storage.removeItem(key);
}

const localProfileStorageApi = Object.freeze({
  load: loadLocalProfile,
  save: saveLocalProfile,
  remove: removeLocalProfile
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = localProfileStorageApi;
} else {
  window.vidvattaProfileStorage = localProfileStorageApi;
}
