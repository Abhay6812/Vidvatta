const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const storageApi = require("../local-profile-storage.js");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

describe("VIDVATTA local profile storage", () => {
  it("loads, saves, and removes a profile through the browser storage interface", () => {
    const storage = memoryStorage();
    const profile = {name: "Student", tracker: []};

    assert.equal(storageApi.load(storage, "profile"), null);
    storageApi.save(storage, "profile", profile);
    assert.deepEqual(storageApi.load(storage, "profile"), profile);
    storageApi.remove(storage, "profile");
    assert.equal(storageApi.load(storage, "profile"), null);
  });

  it("reports invalid stored JSON and unexpected profile shapes", () => {
    assert.throws(() => storageApi.load(memoryStorage({profile: "{"}), "profile"), /not valid JSON/);
    assert.throws(() => storageApi.load(memoryStorage({profile: "[]"}), "profile"), /unexpected format/);
    assert.throws(() => storageApi.save(memoryStorage(), "profile", null), /valid local profile/);
  });

  it("surfaces browser storage failures to the caller", () => {
    const blockedStorage = {
      getItem() {
        throw new Error("storage blocked");
      }
    };

    assert.throws(() => storageApi.load(blockedStorage, "profile"), /storage blocked/);
  });
});
