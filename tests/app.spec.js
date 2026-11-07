const {test, expect} = require("@playwright/test");
const runtimeErrors = new WeakMap();

test.beforeEach(async ({page}) => {
  const errors = {console: [], page: [], requests: [], responses: []};
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.page.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("requestfailed", (request) => {
    errors.requests.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.responses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.afterEach(async ({page}) => {
  expect(runtimeErrors.get(page)).toEqual({console: [], page: [], requests: [], responses: []});
});

async function createLocalProfile(page) {
  await page.locator("#account-button").click();
  await page.locator("#account-name").fill("Test Student");
  await page.locator("#local-profile-consent").check();
  await page.locator("#account-form button[type='submit']").click();
  await expect(page.locator("#account-dialog")).not.toBeVisible();
}

async function fillSTEligibility(page, sscStatus = "passed") {
  const form = page.locator("#eligibility-form");
  await form.locator("[name='track']").selectOption("vocational");
  await form.locator("[name='currentlyEnrolled']").selectOption("yes");
  await form.locator("[name='category']").selectOption("st");
  await form.locator("[name='familyIncome']").selectOption("250001-800000");
  await form.locator("[name='maharashtraDomicile']").selectOption("yes");
  await form.locator("[name='withinFirstTwo']").selectOption("yes");
  await form.locator("[name='gender']").selectOption("female");
  await form.locator("[name='sscStatus']").selectOption(sscStatus);
  await form.locator("[name='recognizedTraining']").selectOption("yes");
  await form.locator("[name='centralTrainingAdmission']").selectOption("yes");
  await form.locator("[name='casteValidity']").selectOption("yes");
  await form.locator("[name='previousTrainingBenefit']").selectOption("no");
  await form.locator("[name='trainingAttendance']").selectOption("yes");
}

async function fillSEBCEligibility(page) {
  const form = page.locator("#eligibility-form");
  await form.locator("[name='track']").selectOption("technical");
  await form.locator("[name='currentlyEnrolled']").selectOption("yes");
  await form.locator("[name='category']").selectOption("sebc");
  await form.locator("[name='familyIncome']").selectOption("250001-800000");
  await form.locator("[name='maharashtraDomicile']").selectOption("yes");
  await form.locator("[name='withinFirstTwo']").selectOption("yes");
  await form.locator("[name='gender']").selectOption("female");
  await form.locator("[name='indianNational']").selectOption("yes");
  await form.locator("[name='capAdmission']").selectOption("yes");
  await form.locator("[name='instituteType']").selectOption("eligible");
  await form.locator("[name='otherScholarship']").selectOption("no");
  await form.locator("[name='technicalAttendance']").selectOption("met");
  await form.locator("[name='studyGap']").selectOption("no");
}

async function tomorrow(page) {
  return page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  });
}

test("loads the journey, landmarks, assets, and valid internal links", async ({page}) => {
  await expect(page).toHaveTitle(/VIDVATTA/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", {name: "Your Scholarship Journey, Simplified"})).toBeVisible();
  await expect(page.locator(".journey-stage")).toHaveCount(5);

  const invalidReferences = await page.evaluate(() => ({
    anchors: [...document.querySelectorAll('a[href^="#"]')]
      .map((anchor) => anchor.getAttribute("href").slice(1))
      .filter((id) => !document.getElementById(id)),
    controls: [...document.querySelectorAll("[aria-controls]")]
      .map((element) => element.getAttribute("aria-controls"))
      .filter((id) => !document.getElementById(id)),
    unsafeExternalLinks: [...document.querySelectorAll('a[target="_blank"]')]
      .filter((anchor) => !anchor.rel.split(/\s+/).includes("noopener"))
      .map((anchor) => anchor.href),
    imageFailures: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.src)
  }));
  expect(invalidReferences).toEqual({anchors: [], controls: [], unsafeExternalLinks: [], imageFailures: []});
});

test("opens every sidebar navigation destination", async ({page}) => {
  const links = await page.locator("#app-sidebar .sidebar-navigation a[href^='#']").all();
  expect(links.length).toBeGreaterThan(0);

  for (const link of links) {
    const href = await link.getAttribute("href");
    await link.click();
    expect(new URL(page.url()).hash).toBe(href);
    await expect(page.locator(href)).toHaveCount(1);
  }
});

test("searches the directory and combines category and study-level filters", async ({page}) => {
  const search = page.locator("#directory-search");
  await search.fill("Eklavya");
  await expect(page.locator(".directory-scheme:visible")).toHaveCount(1);
  await search.fill("no-such-scheme");
  await expect(page.locator(".directory-scheme:visible")).toHaveCount(0);
  await expect(page.locator(".directory-empty")).toBeVisible();

  await search.fill("");
  await page.locator("[data-category='st']").click();
  await page.locator("#directory-level").selectOption("college");
  const matchingRows = page.locator(".directory-scheme:visible");
  await expect(matchingRows).not.toHaveCount(0);
  expect(await matchingRows.evaluateAll((rows) => rows.every((row) => (
    row.dataset.level === "college" && row.dataset.groups.split(" ").includes("st")
  )))).toBe(true);

  await page.locator("#scheme-search").fill("hostel");
  await page.locator("#study-level").selectOption("school");
  await expect(page.locator(".scheme-card:visible")).toHaveCount(0);
  await expect(page.locator("#no-schemes")).toBeVisible();
});

test("validates eligibility and does not infer a rate for a failed SSC branch", async ({page}) => {
  await createLocalProfile(page);
  const form = page.locator("#eligibility-form");
  await form.locator("button[type='submit']").click();
  expect(await form.locator("[name='track']").evaluate((field) => field.validity.valid)).toBe(false);

  await fillSTEligibility(page, "failed");
  await form.locator("button[type='submit']").click();
  const result = page.locator(".eligibility-result").first();
  await expect(result).toHaveAttribute("data-status", "review");
  await expect(result.locator(".check-group-unknown")).toContainText("failed SSC result");
  await expect(result.locator(".check-group-passed")).toBeVisible();
  await expect(result.locator(".check-group-failed")).toBeVisible();
  await expect(result.locator(".eligibility-rate")).toHaveCount(0);
  await expect(page.locator("#eligibility-results")).not.toContainText("100% reimbursement");
});

test("persists document checklist changes across refreshes", async ({page}) => {
  await createLocalProfile(page);
  const checkbox = page.locator("#document-checklist input[type='checkbox']").first();
  await checkbox.check();
  await expect(page.locator("#document-progress")).toContainText("1 of");
  await expect(page.locator("#document-readiness")).toHaveJSProperty("value", 11);
  await expect(page.locator("#missing-documents")).toContainText("Still to prepare");
  await page.reload();
  await expect(page.locator("#document-checklist input[type='checkbox']").first()).toBeChecked();
});

test("creates, edits, and deletes tracker entries and updates roadmap status", async ({page}) => {
  await createLocalProfile(page);
  await page.locator("#tracker-scheme").selectOption("0");
  await page.locator("#tracker-form [name='status']").selectOption("Documents in Preparation");
  await page.locator("#tracker-form button[type='submit']").click();
  await expect(page.locator("#tracker-items .tracker-column")).toHaveCount(6);
  await page.locator("[data-tracker-stage='Documents in Preparation'] .tracker-card")
    .dragTo(page.locator("[data-tracker-stage='Eligibility Checked']"));
  await expect(page.locator("[data-tracker-stage='Eligibility Checked'] .tracker-card")).toHaveCount(1);
  const entry = page.locator("#tracker-items .workspace-item").first();
  await expect(entry).toBeVisible();

  await entry.locator("[data-tracker-scheme]").selectOption("1");
  await entry.locator("[data-tracker-status]").selectOption("Submitted");
  await entry.locator("[data-tracker-date]").fill(await tomorrow(page));
  await entry.locator("[data-tracker-notes]").fill("Check with institute");
  await entry.locator("[data-save-tracker]").click();
  await expect(page.locator("[data-roadmap-step='apply'] .roadmap-status")).toHaveText("Complete");
  await expect(page.locator("#tracker-items")).toContainText("Submitted");
  await expect(page.locator("#tracker-items")).toContainText("Check with institute");
  await expect(page.locator("#tracker-statistics")).toContainText("average journey progress");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vidvattaLocalProfile")).tracker[0].schemeIndex)).toBe("1");

  await entry.locator("[data-remove-tracker]").click();
  await expect(page.locator("#tracker-items .workspace-item")).toHaveCount(0);
});

test("migrates older manual tracker statuses into the six-stage pipeline", async ({page}) => {
  await page.evaluate(() => localStorage.setItem("vidvattaLocalProfile", JSON.stringify({
    name: "Returning Student",
    profileDetails: {familyIncome: "300000"},
    eligibility: {familyIncome: "300000"},
    tracker: [{
      id: "legacy-entry",
      schemeIndex: "0",
      status: "Preparing documents",
      reminderDate: "",
      notes: "Keep existing note"
    }]
  })));
  await page.reload();
  await expect(page.locator("[data-tracker-stage='Documents in Preparation'] .tracker-card")).toBeVisible();
  await expect(page.locator("#tracker-items")).toContainText("Keep existing note");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vidvattaLocalProfile")).tracker[0].status))
    .toBe("Documents in Preparation");
  expect(await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("vidvattaLocalProfile"));
    return [profile.profileDetails.familyIncome, profile.eligibility.familyIncome];
  })).toEqual(["250001-800000", "250001-800000"]);
});

test("provides an explainable match and a bounded supported benefit estimate", async ({page}) => {
  await createLocalProfile(page);
  await fillSEBCEligibility(page);
  await page.locator("#eligibility-form button[type='submit']").click();
  const result = page.locator(".eligibility-result[data-status='possible']").first();
  await expect(result).toContainText("Why this scheme is shown");

  await page.locator("#benefit-calculator [name='tuitionFee']").fill("60000");
  await page.locator("#benefit-calculator [name='examFee']").fill("4000");
  await page.locator("#benefit-calculator button[type='submit']").click();
  await expect(page.locator("#benefit-result")).toContainText("₹64,000");

  await page.locator("#benefit-calculator [name='scheme']").selectOption("st-training");
  await page.locator("#benefit-calculator button[type='submit']").click();
  await expect(page.locator("#benefit-error")).toContainText("not represented");
});

test("offers curated Marathi rule-based guidance", async ({page}) => {
  await page.locator("#guide-form [name='language']").selectOption("mr");
  await page.locator("#guide-form [name='question']").selectOption("status");
  await page.locator("#guide-form button[type='submit']").click();
  await expect(page.locator("#guide-answer")).toContainText("सहा स्थानिक टप्प्यांमधून");
  await expect(page.locator("#guide-answer a")).toHaveAttribute("href", "#tracker");
});

test("validates and persists upcoming personal reminders", async ({page}) => {
  await createLocalProfile(page);
  const title = page.locator("#calendar-form [name='title']");
  const date = page.locator("#calendar-form [name='date']");
  await title.fill("   ");
  await date.fill(await tomorrow(page));
  await page.locator("#calendar-form button[type='submit']").click();
  await expect(page.locator("#calendar-error")).toContainText("reminder title");
  await expect(page.locator("#calendar-items .workspace-item")).toHaveCount(0);

  await title.fill("Ask institute about CAP documents");
  await date.fill(await tomorrow(page));
  await page.locator("#calendar-form button[type='submit']").click();
  await expect(page.locator("#calendar-items")).toContainText("Upcoming reminders");
  await expect(page.locator("#calendar-items")).toContainText("Ask institute about CAP documents");
  await page.reload();
  await expect(page.locator("#calendar-items")).toContainText("Ask institute about CAP documents");
  await page.locator("#calendar-items [data-remove-reminder]").click();
  await expect(page.locator("#calendar-items")).toContainText("No reminders yet");
});

test("compares two different schemes and rejects comparing a scheme with itself", async ({page}) => {
  await page.locator("#compare-first").selectOption("0");
  await page.locator("#compare-second").selectOption("0");
  await page.locator("#compare-form button[type='submit']").click();
  await expect(page.locator("#compare-results")).toContainText("two different");

  await page.locator("#compare-second").selectOption("1");
  await page.locator("#compare-form button[type='submit']").click();
  await expect(page.locator(".compare-card")).toHaveCount(2);
  await expect(page.locator(".compare-card").first()).toContainText("College");
});

test("opens and closes the mobile navigation with keyboard support", async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  const toggle = page.locator(".menu-toggle");
  const sidebar = page.locator("#app-sidebar");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar).not.toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar).toHaveAttribute("inert", "");

  await toggle.click();
  await sidebar.locator("a[href='#scholarships']").click();
  await expect(page).toHaveURL(/#scholarships$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("avoids horizontal overflow at phone, tablet, laptop, and desktop widths", async ({page}) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    expect(metrics.document, `document overflow at ${width}px`).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.body, `body overflow at ${width}px`).toBeLessThanOrEqual(metrics.viewport);
  }
});

test("keeps the saved dashboard and Kanban board inside mobile and desktop viewports", async ({page}) => {
  await createLocalProfile(page);
  await page.locator("#tracker-scheme").selectOption("0");
  await page.locator("#tracker-form [name='status']").selectOption("Discovered");
  await page.locator("#tracker-form button[type='submit']").click();

  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      board: document.querySelector("#tracker-items").getBoundingClientRect().width
    }));
    expect(metrics.document, `saved dashboard overflow at ${width}px`).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.board, `Kanban board exceeds viewport at ${width}px`).toBeLessThanOrEqual(metrics.viewport);
  }
});

test("labels visible form controls and actionable buttons for assistive technology", async ({page}) => {
  await createLocalProfile(page);
  const unlabeled = await page.evaluate(() => {
    const controls = [...document.querySelectorAll("input, select, textarea")]
      .filter((element) => !element.closest("[hidden]") && !element.closest("dialog:not([open])"))
      .filter((element) => !element.labels?.length
        && !element.getAttribute("aria-label")
        && !element.getAttribute("aria-labelledby"));
    const buttons = [...document.querySelectorAll("button")]
      .filter((element) => !element.closest("[hidden]") && !element.closest("dialog:not([open])"))
      .filter((element) => !element.textContent.trim() && !element.getAttribute("aria-label"));
    return [...controls, ...buttons].map((element) => element.outerHTML);
  });
  expect(unlabeled).toEqual([]);
});
