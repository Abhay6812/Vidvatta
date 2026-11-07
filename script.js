const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector("#app-sidebar");
const sidebarScrim = document.querySelector("#sidebar-scrim");
const sidebarLinks = [...document.querySelectorAll(".sidebar-navigation a")];
const pageTitle = document.querySelector("#page-title");

function closeMobileNavigation(restoreFocus = false) {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  sidebar.classList.remove("is-open");
  sidebarScrim.hidden = true;
  sidebar.inert = window.matchMedia("(max-width: 700px)").matches;
  if (restoreFocus) menuToggle.focus();
}

function openMobileNavigation() {
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation");
  sidebar.classList.add("is-open");
  sidebar.inert = false;
  sidebarScrim.hidden = false;
  sidebarLinks[0]?.focus();
}

function updateNavigationForViewport() {
  if (!window.matchMedia("(max-width: 700px)").matches) {
    sidebar.inert = false;
    sidebar.classList.remove("is-open");
    sidebarScrim.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    return;
  }
  if (menuToggle.getAttribute("aria-expanded") !== "true") sidebar.inert = true;
}

menuToggle.addEventListener("click", () => {
  if (menuToggle.getAttribute("aria-expanded") === "true") closeMobileNavigation();
  else openMobileNavigation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    closeMobileNavigation(true);
  }
});

window.addEventListener("resize", updateNavigationForViewport);
updateNavigationForViewport();

function activateSidebarLink(link) {
  sidebarLinks.forEach((sidebarLink) => sidebarLink.removeAttribute("aria-current"));
  link.setAttribute("aria-current", "page");
  pageTitle.textContent = link.dataset.pageTitle;
}

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    activateSidebarLink(link);
    if (window.matchMedia("(max-width: 700px)").matches) {
      closeMobileNavigation(true);
    }
  });
});

function markDiscoveryViewed() {
  if (!localProfile) return;
  localProfile.discoverViewed = true;
  persistWorkspaceProfile(roadmapError);
  updateRoadmap();
}

document.querySelectorAll('a[href="#scholarships"]').forEach((link) => {
  link.addEventListener("click", markDiscoveryViewed);
});

sidebarScrim.addEventListener("click", () => closeMobileNavigation(true));

function updateSidebarFromHash() {
  const activeLink = sidebarLinks.find((link) => link.hash === window.location.hash);
  if (activeLink) activateSidebarLink(activeLink);
}

window.addEventListener("hashchange", updateSidebarFromHash);
updateSidebarFromHash();
if (!window.location.hash) {
  const overviewLink = sidebarLinks.find((link) => link.hash === "#top");
  if (overviewLink) activateSidebarLink(overviewLink);
}

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const shouldOpen = !item.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((faqItem) => {
      faqItem.classList.remove("is-open");
      faqItem.querySelector("button").setAttribute("aria-expanded", "false");
    });
    if (shouldOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

const schemeFilters = document.querySelector("#scheme-filters");
const schemeCards = [...document.querySelectorAll(".scheme-card")];
const noSchemesMessage = document.querySelector("#no-schemes");
const resultsCount = document.querySelector("#results-count");
const schemeCatalog = window.vidvattaSchemes;
const categoryChips = document.querySelector("#category-chips");
const allSchemesList = document.querySelector("#all-schemes-list");
const directorySearch = document.querySelector("#directory-search");
const directoryLevel = document.querySelector("#directory-level");
const directoryResults = document.querySelector("#directory-results");

const schemeCategories = [
  {id:"sc",label:"Scheduled Caste (SC)"},
  {id:"st",label:"Scheduled Tribe (ST)"},
  {id:"obc",label:"Other Backward Class (OBC)"},
  {id:"vjnt",label:"VJNT"},
  {id:"sbc",label:"SBC"},
  {id:"sebc",label:"SEBC"},
  {id:"ews",label:"EWS / Economically Weaker"},
  {id:"ebc",label:"Economically Backward Class (EBC)"},
  {id:"bpl",label:"Below Poverty Line (BPL)"},
  {id:"minority",label:"Minority"},
  {id:"open",label:"Open category"},
  {id:"merit",label:"Merit-based"},
  {id:"girls",label:"Girls / Women"},
  {id:"exservice",label:"Ex-servicemen families"},
  {id:"freedom",label:"Freedom-fighter families"},
  {id:"other",label:"Other / scheme-specific"}
];

const schemeCategoryLabels = new Map(schemeCategories.map(({id, label}) => [id, label]));

if (!Array.isArray(schemeCatalog)) {
  throw new Error("The VIDVATTA scheme catalogue could not be loaded.");
}

let selectedCategory = "all";

function createCategoryChip(category, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-chip";
  button.dataset.category = category.id;
  button.append(document.createTextNode(category.label));

  const countLabel = document.createElement("span");
  countLabel.textContent = String(count);
  button.append(countLabel);
  button.addEventListener("click", () => {
    selectedCategory = category.id;
    renderSchemeDirectory();
  });
  return button;
}

const categoryOptions = [
  {id:"all",label:"All categories"},
  ...schemeCategories
];
categoryChips.append(...categoryOptions.map((category) => {
  const count = category.id === "all"
    ? schemeCatalog.length
    : schemeCatalog.filter((scheme) => scheme.groups.includes(category.id)).length;
  return createCategoryChip(category, count);
}));

function createSchemeRow(scheme) {
  const article = document.createElement("article");
  article.className = "directory-scheme";
  article.setAttribute("role", "listitem");
  article.dataset.level = scheme.level;
  article.dataset.groups = scheme.groups.join(" ");
  article.dataset.search = `${scheme.name} ${scheme.department} ${scheme.groups.map((group) => schemeCategoryLabels.get(group)).join(" ")}`.toLocaleLowerCase();

  const heading = document.createElement("h3");
  heading.textContent = scheme.name;

  const department = document.createElement("span");
  department.className = "scheme-department";
  department.textContent = scheme.department;

  const officialLink = document.createElement("a");
  officialLink.href = scheme.level === "school"
    ? "https://mahadbt2.maharashtra.gov.in/school-student"
    : "https://mahadbt2.maharashtra.gov.in/college-student";
  officialLink.target = "_blank";
  officialLink.rel = "noopener noreferrer";
  officialLink.textContent = "Official listing ↗";

  const tags = document.createElement("div");
  tags.className = "directory-tags";
  const levelTag = document.createElement("span");
  levelTag.className = "directory-tag";
  levelTag.textContent = scheme.level === "school" ? "School" : "College";
  tags.append(levelTag);

  scheme.groups.forEach((group) => {
    const tag = document.createElement("span");
    tag.className = "directory-tag";
    tag.dataset.group = group;
    tag.textContent = schemeCategoryLabels.get(group);
    tags.append(tag);
  });

  article.append(heading, department, officialLink, tags);
  return article;
}

const allSchemeRows = schemeCatalog.map(createSchemeRow);
allSchemesList.append(...allSchemeRows);
const noDirectorySchemes = document.createElement("p");
noDirectorySchemes.className = "directory-empty";
noDirectorySchemes.hidden = true;
noDirectorySchemes.textContent = "No schemes match these filters. Try another category or search term, or check the official MahaDBT directory.";
allSchemesList.after(noDirectorySchemes);

function renderSchemeDirectory() {
  const visibleRows = allSchemeRows.filter((row) => {
    const matchesCategory = selectedCategory === "all" || row.dataset.groups.split(" ").includes(selectedCategory);
    const matchesLevel = directoryLevel.value === "all" || row.dataset.level === directoryLevel.value;
    const matchesSearch = row.dataset.search.includes(directorySearch.value.trim().toLocaleLowerCase());
    const isVisible = matchesCategory && matchesLevel && matchesSearch;
    row.hidden = !isVisible;
    return isVisible;
  });

  categoryChips.querySelectorAll(".category-chip").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === selectedCategory));
  });
  directoryResults.textContent = `Showing ${visibleRows.length} of ${schemeCatalog.length} official student scheme listings`;
  noDirectorySchemes.hidden = visibleRows.length > 0;
}

function filterSchemes() {
  const searchTerm = document.querySelector("#scheme-search").value.trim().toLocaleLowerCase();
  const studyLevel = document.querySelector("#study-level").value;
  const community = document.querySelector("#community").value;
  let visibleCount = 0;

  schemeCards.forEach((card) => {
    const matchesSearch = !searchTerm || `${card.dataset.search} ${card.innerText}`.toLocaleLowerCase().includes(searchTerm);
    const matchesLevel = studyLevel === "all" || card.dataset.level === studyLevel;
    const matchesCommunity = community === "all" || card.dataset.groups.split(" ").includes(community);
    const isVisible = matchesSearch && matchesLevel && matchesCommunity;

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  resultsCount.textContent = `Showing ${visibleCount} of ${schemeCards.length} featured schemes`;
  noSchemesMessage.hidden = visibleCount > 0;
}

schemeFilters.addEventListener("submit", (event) => {
  event.preventDefault();
  filterSchemes();
});
schemeFilters.addEventListener("input", filterSchemes);
schemeFilters.addEventListener("change", filterSchemes);
directorySearch.addEventListener("input", renderSchemeDirectory);
directoryLevel.addEventListener("change", renderSchemeDirectory);
filterSchemes();
renderSchemeDirectory();

const localProfileKey = "vidvattaLocalProfile";
const profileStorage = window.vidvattaProfileStorage;
const verifiedEligibilityRules = window.vidvattaEligibility.rules;
const assessRule = window.vidvattaEligibility.assess;
const matchRules = window.vidvattaEligibility.match;
const accountButton = document.querySelector("#account-button");
const accountButtonLabel = document.querySelector("#account-button-label");
const headerAvatar = document.querySelector("#header-avatar");
const accountDialog = document.querySelector("#account-dialog");
const accountForm = document.querySelector("#account-form");
const accountName = document.querySelector("#account-name");
const accountConsent = document.querySelector("#local-profile-consent");
const accountTitle = document.querySelector("#account-dialog-title");
const accountError = document.querySelector("#account-error");
const deleteProfileButton = document.querySelector("#delete-profile");
const eligibilityGate = document.querySelector("#eligibility-gate");
const eligibilityForm = document.querySelector("#eligibility-form");
const eligibilityResults = document.querySelector("#eligibility-results");
const eligibilityError = document.querySelector("#eligibility-error");
const vocationalCriteria = document.querySelector("#vocational-criteria");
const technicalCriteria = document.querySelector("#technical-criteria");
const profileGate = document.querySelector("#profile-gate");
const profileDetailsForm = document.querySelector("#profile-details-form");
const profileFormError = document.querySelector("#profile-form-error");
const profileDisplayName = document.querySelector("#profile-display-name");
const profileDisplayLocation = document.querySelector("#profile-display-location");
const workspaceGates = ["documents", "tracker", "calendar"].map((id) => document.querySelector(`#${id}-gate`));
const workspacePanels = ["documents", "tracker", "calendar"].map((id) => document.querySelector(`#${id}-panel`));
const trackerForm = document.querySelector("#tracker-form");
const trackerItems = document.querySelector("#tracker-items");
const trackerError = document.querySelector("#tracker-error");
const calendarForm = document.querySelector("#calendar-form");
const calendarItems = document.querySelector("#calendar-items");
const calendarError = document.querySelector("#calendar-error");
const documentChecklist = document.querySelector("#document-checklist");
const documentScheme = document.querySelector("#document-scheme");
const documentProgress = document.querySelector("#document-progress");
const documentReadiness = document.querySelector("#document-readiness");
const missingDocuments = document.querySelector("#missing-documents");
const documentNote = document.querySelector("#documents-note");
const documentsError = document.querySelector("#documents-error");
const compareForm = document.querySelector("#compare-form");
const compareFirst = document.querySelector("#compare-first");
const compareSecond = document.querySelector("#compare-second");
const compareResults = document.querySelector("#compare-results");
const benefitForm = document.querySelector("#benefit-calculator");
const benefitResult = document.querySelector("#benefit-result");
const benefitError = document.querySelector("#benefit-error");
const guideForm = document.querySelector("#guide-form");
const guideAnswer = document.querySelector("#guide-answer");
const roadmapItems = [...document.querySelectorAll(".roadmap-item")];
const roadmapNextAction = document.querySelector("#roadmap-next-action");
const roadmapError = document.querySelector("#roadmap-error");
let localProfile = null;
let profileStorageError = null;

function showProfileError(message) {
  accountError.textContent = message;
  accountError.hidden = false;
}

function showEligibilityError(message) {
  eligibilityError.textContent = message;
  eligibilityError.hidden = false;
}

function saveLocalProfile() {
  try {
    profileStorage.save(window.localStorage, localProfileKey, localProfile);
    profileStorageError = null;
    return true;
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    profileStorageError = `Your profile could not be saved in this browser.${reason}`;
    showProfileError(profileStorageError);
    return false;
  }
}

function setConditionalCriteria() {
  const track = eligibilityForm.elements.namedItem("track").value;
  [
    [vocationalCriteria, track === "vocational"],
    [technicalCriteria, track === "technical"]
  ].forEach(([fieldset, isActive]) => {
    fieldset.hidden = !isActive;
    fieldset.disabled = !isActive;
    fieldset.querySelectorAll("select").forEach((select) => {
      select.required = isActive;
    });
  });
}

function normalizeIncomeBand(value) {
  const raw = String(value ?? "").trim();
  if (["0-250000", "250001-800000", "800001+", "unknown"].includes(raw)) return raw;
  if (!raw) return "";
  const income = Number(raw);
  if (!Number.isFinite(income) || income < 0) return "unknown";
  if (income <= 250000) return "0-250000";
  if (income <= 800000) return "250001-800000";
  return "800001+";
}

function fillEligibilityForm() {
  const details = localProfile?.profileDetails || {};
  const savedAnswers = {
    ...(details.course ? {
      track: details.course === "school" ? "other" : details.course,
      category: details.category,
      familyIncome: normalizeIncomeBand(details.familyIncome),
      maharashtraDomicile: details.state === "Maharashtra" ? "yes" : "no"
    } : {}),
    ...(localProfile?.eligibility || {})
  };

  Object.entries(savedAnswers).forEach(([name, value]) => {
    const field = eligibilityForm.elements.namedItem(name);
    if (field && typeof value === "string") {
      field.value = name === "familyIncome" ? normalizeIncomeBand(value) : value;
    }
  });
  setConditionalCriteria();
}

function fillProfileDetailsForm() {
  const details = localProfile?.profileDetails || {};
  const eligibility = localProfile?.eligibility || {};
  const values = {
    name: details.name || localProfile?.name || "",
    state: details.state || (eligibility.maharashtraDomicile === "no" ? "Other" : ""),
    district: details.district || "",
    course: details.course || eligibility.track || "",
    branch: details.branch || "",
    academicYear: details.academicYear || "",
    college: details.college || "",
    university: details.university || "",
    previousPercentage: details.previousPercentage || "",
    familyIncome: normalizeIncomeBand(details.familyIncome || eligibility.familyIncome || "")
  };

  Object.entries(values).forEach(([name, value]) => {
    const field = profileDetailsForm.elements.namedItem(name);
    if (field) field.value = value;
  });
  const category = details.category || eligibility.category;
  if (category) {
    const categoryInput = profileDetailsForm.querySelector(`input[name="category"][value="${category}"]`);
    if (categoryInput) categoryInput.checked = true;
  }
}

function updateProfileUI() {
  const hasProfile = Boolean(localProfile);
  accountButtonLabel.textContent = hasProfile ? localProfile.name : "Create account";
  const initials = hasProfile
    ? localProfile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() || "").join("")
    : "";
  headerAvatar.textContent = initials;
  headerAvatar.hidden = !hasProfile;
  accountButton.setAttribute("aria-label", hasProfile ? `Open profile for ${localProfile.name}` : "Create local account");
  accountTitle.textContent = hasProfile ? "Your local profile" : "Create your account";
  accountName.value = localProfile?.name || "";
  accountConsent.checked = hasProfile;
  deleteProfileButton.hidden = !hasProfile;
  eligibilityGate.hidden = hasProfile;
  eligibilityForm.hidden = !hasProfile;
  profileGate.hidden = hasProfile;
  profileDetailsForm.hidden = !hasProfile;
  workspaceGates.forEach((gate) => { gate.hidden = hasProfile; });
  workspacePanels.forEach((panel) => { panel.hidden = !hasProfile; });
  accountError.hidden = true;

  if (hasProfile) {
    fillProfileDetailsForm();
    fillEligibilityForm();
    if (localProfile.eligibility) renderEligibilityResults(localProfile.eligibility);
    profileDisplayName.textContent = localProfile.name || "Your profile";
    const details = localProfile.profileDetails || {};
    profileDisplayLocation.textContent = [details.district, details.state].filter(Boolean).join(", ") || "Add your district and state";
    updateDocumentSchemeFromProfile();
    renderDocumentChecklist();
    renderTrackerItems();
    renderCalendarItems();
    updateRoadmap();
    if (profileStorageError) {
      profileFormError.textContent = profileStorageError;
      profileFormError.hidden = false;
    }
  } else {
    eligibilityResults.replaceChildren();
    profileFormError.hidden = true;
    trackerItems.replaceChildren();
    calendarItems.replaceChildren();
    documentChecklist.replaceChildren();
    compareResults.replaceChildren();
  }
}

function openAccountDialog() {
  if (profileStorageError) showProfileError(profileStorageError);
  else accountError.hidden = true;
  accountName.value = localProfile?.name || "";
  accountConsent.checked = Boolean(localProfile);
  if (!accountDialog.open) accountDialog.showModal();
}

function appendMessage(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderRuleResult(rule, profile, assessment = assessRule(rule, profile)) {
  const {failedChecks, passedChecks, unknownChecks, status} = assessment;
  const categoryMatches = profile.category === rule.category;
  const trackMatches = profile.track === rule.track;
  const card = document.createElement("article");
  card.className = "eligibility-result";
  card.dataset.status = status;
  appendMessage(card, "h3", "", rule.name);
  appendMessage(
    card,
    "p",
    "eligibility-explanation",
    categoryMatches && trackMatches
      ? "Why this scheme is shown: your selected category and study track match this rule set. Review each condition below; this is guidance, not an award prediction."
      : "Why this scheme is shown: your selected category or study track relates to this rule set. Any mismatch or unknown condition is listed below; this is guidance, not an award prediction."
  );

  const statusText = status === "possible"
    ? "Potential match — all checked criteria match; MahaDBT makes the final eligibility decision."
    : status === "review"
      ? "Needs verification — one or more conditions are unverified."
      : "Does not match all published checks — this is not a decision on other schemes.";
  appendMessage(card, "p", "eligibility-status", statusText);

  if (status === "possible") {
    appendMessage(card, "p", "eligibility-rate", rule.benefit(profile));
  } else if (status === "review") {
    appendMessage(card, "p", "eligibility-explanation", "No benefit percentage is shown until the relevant published checks can be confirmed.");
  }

  [
    {title: "Conditions that match", checks: passedChecks, className: "check-group-passed", empty: "No confirmed conditions yet."},
    {title: "Conditions that do not match", checks: failedChecks, className: "check-group-failed", empty: "No failed conditions."},
    {title: "Conditions to verify", checks: unknownChecks, className: "check-group-unknown", empty: "No unverified conditions."}
  ].forEach(({title, checks, className, empty}) => {
    const group = document.createElement("section");
    group.className = `eligibility-check-group ${className}`;
    appendMessage(group, "h4", "", title);
    const list = document.createElement("ul");
    (checks.length ? checks.map((check) => check.label) : [empty]).forEach((label) => {
      appendMessage(list, "li", "", label);
    });
    group.append(list);
    card.append(group);
  });

  appendMessage(card, "p", "eligibility-explanation", "MahaDBT labels these as tentative benefits. Final amounts depend on the official rules, course, fee assessment, documents, and current scheme availability.");
  const officialLink = document.createElement("a");
  officialLink.href = rule.url;
  officialLink.target = "_blank";
  officialLink.rel = "noopener noreferrer";
  officialLink.textContent = `Verify ${rule.department} details on MahaDBT ↗`;
  card.append(officialLink);
  return card;
}

function renderEligibilityResults(profile) {
  const results = matchRules(profile).map(({rule, ...assessment}) => renderRuleResult(rule, profile, assessment));
  eligibilityResults.replaceChildren();

  if (!results.length) {
    appendMessage(
      eligibilityResults,
      "p",
      "eligibility-empty",
      "This screener does not yet have verified eligibility rules for this category and course. No match or percentage is being guessed. Browse the full directory and confirm scheme details with MahaDBT."
    );
    return;
  }

  results.forEach((result) => eligibilityResults.append(result));
  appendMessage(
    eligibilityResults,
    "p",
    "eligibility-empty",
    "This first version checks only the two schemes shown above. A missing match does not mean you are ineligible for other MahaDBT schemes. Browse the selected directory and verify the current rules on the official portal."
  );
}

try {
  localProfile = profileStorage.load(window.localStorage, localProfileKey);
  if (localProfile) {
    let incomeBandChanged = false;
    ["profileDetails", "eligibility"].forEach((sectionName) => {
      const section = localProfile[sectionName];
      if (!section || typeof section !== "object"
        || !Object.prototype.hasOwnProperty.call(section, "familyIncome")) return;
      const incomeBand = normalizeIncomeBand(section.familyIncome);
      if (incomeBand === section.familyIncome) return;
      section.familyIncome = incomeBand;
      incomeBandChanged = true;
    });
    if (incomeBandChanged) {
      try {
        profileStorage.save(window.localStorage, localProfileKey, localProfile);
      } catch (error) {
        const reason = error instanceof Error ? ` ${error.message}` : "";
        profileStorageError = `Older exact income data could not be converted to an income range in this browser.${reason}`;
      }
    }
  }
} catch (error) {
  const reason = error instanceof Error ? error.message : "Browser storage is unavailable.";
  profileStorageError = `The saved profile could not be read. ${reason}`;
}

accountButton.addEventListener("click", openAccountDialog);
document.querySelectorAll("[data-open-account]").forEach((button) => {
  button.addEventListener("click", openAccountDialog);
});
document.querySelectorAll("[data-close-account]").forEach((button) => {
  button.addEventListener("click", () => accountDialog.close());
});
accountDialog.addEventListener("click", (event) => {
  if (event.target === accountDialog) accountDialog.close();
});

accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  accountError.hidden = true;
  const name = accountName.value.trim();
  if (!name || !accountConsent.checked) {
    showProfileError("Enter your name and confirm that you understand this local-only profile.");
    return;
  }

  localProfile = {...(localProfile || {}), name};
  if (localProfile.profileDetails) {
    localProfile.profileDetails = {...localProfile.profileDetails, name};
  }
  if (!saveLocalProfile()) return;
  accountDialog.close();
  updateProfileUI();
  document.querySelector("#profile").scrollIntoView({behavior: "smooth", block: "start"});
});

deleteProfileButton.addEventListener("click", () => {
  if (!window.confirm("Delete your local VIDVATTA profile and all saved eligibility answers from this browser?")) return;
  try {
    profileStorage.remove(window.localStorage, localProfileKey);
    profileStorageError = null;
    localProfile = null;
    accountForm.reset();
    eligibilityForm.reset();
    profileDetailsForm.reset();
    trackerForm.reset();
    calendarForm.reset();
    eligibilityResults.replaceChildren();
    updateProfileUI();
    accountDialog.close();
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    showProfileError(`Your local profile could not be deleted.${reason}`);
  }
});

function persistWorkspaceProfile(errorElement) {
  try {
    profileStorage.save(window.localStorage, localProfileKey, localProfile);
    profileStorageError = null;
    errorElement.hidden = true;
    return true;
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    errorElement.textContent = `Your changes could not be saved in this browser.${reason}`;
    errorElement.hidden = false;
    profileStorageError = errorElement.textContent;
    return false;
  }
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const trackerStatuses = [
  "Discovered",
  "Eligibility Checked",
  "Documents in Preparation",
  "Ready to Apply",
  "Submitted",
  "Completed / Result Awaited"
];
const legacyTrackerStatuses = new Map([
  ["Preparing documents", "Documents in Preparation"],
  ["Ready to apply", "Ready to Apply"],
  ["Waiting for institute", "Submitted"],
  ["Follow up needed", "Submitted"]
]);

function todayAsDateInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const today = todayAsDateInputValue();
calendarForm.elements.namedItem("date").min = today;
trackerForm.elements.namedItem("reminderDate").min = today;

function appendWorkspaceEmpty(parent, text) {
  appendMessage(parent, "p", "workspace-empty", text);
}

function fillProfileCategory(category) {
  const input = profileDetailsForm.querySelector(`input[name="category"][value="${category}"]`);
  if (input) input.checked = true;
}

profileDetailsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profileFormError.hidden = true;
  if (!localProfile) {
    profileFormError.textContent = "Create a local profile before saving your details.";
    profileFormError.hidden = false;
    return;
  }

  const details = Object.fromEntries(new FormData(profileDetailsForm).entries());
  details.name = details.name.trim();
  details.district = details.district.trim();
  details.branch = details.branch.trim();
  details.college = details.college.trim();
  details.university = details.university.trim();
  localProfile = {...localProfile, name: details.name, profileDetails: details};

  if (localProfile.eligibility) {
    localProfile.eligibility = {
      ...localProfile.eligibility,
      track: details.course === "school" ? "other" : details.course,
      category: details.category,
      familyIncome: details.familyIncome,
      maharashtraDomicile: details.state === "Maharashtra" ? "yes" : "no"
    };
  }

  if (!persistWorkspaceProfile(profileFormError)) return;
  updateProfileUI();
  updateRoadmap();
});

const schemeDocuments = {
  "st-training": [
    "Aadhaar card (show only through the official application process)",
    "Ration card",
    "SSC / HSC marksheet",
    "Previous-year marksheet for renewal",
    "Maharashtra domicile certificate",
    "Income certificate from a competent authority",
    "ST caste certificate and caste validity certificate",
    "Original leaving / transfer certificate",
    "Recognized DGT / MSCVT course and admission details"
  ],
  "sebc-technical": [
    "SEBC caste certificate",
    "10th SSC and onward marksheets",
    "Maharashtra domicile certificate",
    "Non-creamy layer certificate",
    "Undertaking that no more than two family members receive the benefit",
    "Centralized Admission Process (CAP) document"
  ]
};
const schemeDocumentSources = {
  "st-training": "https://mahadbt2.maharashtra.gov.in/college-student",
  "sebc-technical": "https://mahadbt2.maharashtra.gov.in/college-student"
};

function updateDocumentSchemeFromProfile() {
  const category = localProfile?.eligibility?.category || localProfile?.profileDetails?.category;
  if (category === "st") documentScheme.value = "st-training";
  if (category === "sebc") documentScheme.value = "sebc-technical";
}

function renderDocumentChecklist() {
  if (!localProfile) return;
  documentsError.hidden = true;
  const schemeId = documentScheme.value;
  const items = schemeDocuments[schemeId];
  if (!items) {
    documentsError.textContent = "The selected scheme does not have a verified document list yet.";
    documentsError.hidden = false;
    documentChecklist.replaceChildren();
    return;
  }

  const saved = localProfile.documentChecks?.[schemeId] || {};
  const labels = schemeId === "st-training"
    ? "Reimbursement of Training Fees for Scheduled Tribe Students"
    : "Rajarshi Chhatrapati Shahu Maharaj Tuition Fee Scholarship — SEBC — Technical Education";
  documentNote.replaceChildren(
    document.createTextNode(`${labels}. Requirements can change. Readiness is your own preparation status, not document verification. Only check marks are saved; no files, document numbers, or personal document metadata are collected. `)
  );
  const sourceLink = document.createElement("a");
  sourceLink.href = schemeDocumentSources[schemeId];
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = "Verify current requirements on MahaDBT ↗";
  documentNote.append(sourceLink);
  documentChecklist.replaceChildren();

  items.forEach((text, index) => {
    const label = document.createElement("label");
    label.className = "document-check-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(saved[index]);
    checkbox.addEventListener("change", () => {
      const current = localProfile.documentChecks?.[schemeId] || {};
      localProfile.documentChecks = {
        ...(localProfile.documentChecks || {}),
        [schemeId]: {...current, [index]: checkbox.checked}
      };
      if (!persistWorkspaceProfile(documentsError)) return;
      updateDocumentReadiness(items, localProfile.documentChecks[schemeId]);
      updateRoadmap();
    });
    label.append(checkbox, document.createTextNode(text));
    documentChecklist.append(label);
  });

  const checkedCount = items.filter((_, index) => Boolean(saved[index])).length;
  updateDocumentReadiness(items, saved);
  updateRoadmap();
}

function updateDocumentReadiness(items, saved) {
  const checkedCount = items.filter((_, index) => Boolean(saved[index])).length;
  const percentage = Math.round((checkedCount / items.length) * 100);
  documentReadiness.value = percentage;
  documentReadiness.setAttribute("aria-label", `Document checklist readiness: ${percentage}%`);
  documentProgress.textContent = `${checkedCount} of ${items.length} checklist items marked ready (${percentage}%). Not verified by MahaDBT.`;
  missingDocuments.replaceChildren();
  const missing = items.filter((_, index) => !saved[index]);
  appendMessage(missingDocuments, "li", "", missing.length
    ? `Still to prepare: ${missing.join("; ")}`
    : "All listed checklist items are marked ready. Confirm the current official requirements before applying.");
}

documentScheme.addEventListener("change", renderDocumentChecklist);

function getWorkspaceEntries(key, errorElement) {
  let entries = localProfile[key] || [];
  if (key === "tracker" && Array.isArray(entries)) {
    let migrated = false;
    entries = entries.map((entry) => {
      const newStatus = legacyTrackerStatuses.get(entry?.status);
      if (!newStatus) return entry;
      migrated = true;
      const legacyNote = `Previous tracker status: ${entry.status}`;
      return {
        ...entry,
        status: newStatus,
        notes: [entry.notes, legacyNote].filter(Boolean).join(" · ")
      };
    });
    if (migrated) {
      localProfile.tracker = entries;
      if (!persistWorkspaceProfile(errorElement)) return null;
    }
  }
  const validEntries = Array.isArray(entries) && entries.every((entry) => (
    entry
    && typeof entry === "object"
    && typeof entry.id === "string"
    && (key === "tracker"
      ? typeof entry.schemeIndex === "string"
        && Boolean(schemeCatalog[Number(entry.schemeIndex)])
        && trackerStatuses.includes(entry.status)
        && typeof entry.reminderDate === "string"
        && (!entry.reminderDate || isValidDateInput(entry.reminderDate))
      : typeof entry.title === "string"
        && Boolean(entry.title.trim())
        && isValidDateInput(entry.date))
  ));
  if (validEntries) return entries;
  errorElement.textContent = "Saved workspace data has an unexpected format. Delete the local profile and create a new one to reset it.";
  errorElement.hidden = false;
  return null;
}

function renderTrackerItems() {
  if (!localProfile) return;
  trackerError.hidden = true;
  const entries = getWorkspaceEntries("tracker", trackerError);
  if (!entries) return;
  trackerItems.replaceChildren();
  trackerItems.classList.add("tracker-board");
  trackerItems.setAttribute("aria-label", "Application pipeline. Drag cards to a stage or use each card's stage selector.");
  trackerItems.setAttribute("role", "region");
  trackerItems.tabIndex = 0;
  renderTrackerStatistics(entries);
  if (!entries.length) {
    appendWorkspaceEmpty(trackerItems, "Your tracker is empty. Add a scheme and update its status yourself; this does not connect to MahaDBT.");
    return;
  }

  trackerStatuses.forEach((status) => {
    const column = document.createElement("section");
    column.className = "tracker-column";
    column.dataset.trackerStage = status;
    column.setAttribute("aria-label", `${status} stage`);
    const stageEntries = entries.filter((entry) => entry.status === status);
    appendMessage(column, "h3", "tracker-column-title", status);
    const count = appendMessage(column, "span", "tracker-column-count", String(stageEntries.length));
    count.setAttribute("aria-label", `${stageEntries.length} applications`);
    const list = document.createElement("div");
    list.className = "tracker-column-items";
    if (!stageEntries.length) {
      appendWorkspaceEmpty(list, "Drop an application here or change its stage.");
    }
    stageEntries.forEach((entry) => list.append(renderTrackerCard(entry)));
    column.append(list);
    trackerItems.append(column);
  });
}

function renderTrackerStatistics(entries) {
  const total = entries.length;
  const progress = total
    ? Math.round(entries.reduce((sum, entry) => sum + trackerStatuses.indexOf(entry.status) + 1, 0) / (total * trackerStatuses.length) * 100)
    : 0;
  const status = document.createElement("p");
  status.textContent = `${total} tracked ${total === 1 ? "application" : "applications"} · average journey progress ${progress}% · manually maintained`;
  const progressBar = document.createElement("progress");
  progressBar.max = 100;
  progressBar.value = progress;
  progressBar.setAttribute("aria-label", `Average application journey progress: ${progress}%`);
  document.querySelector("#tracker-statistics").replaceChildren(status, progressBar);
}

function renderTrackerCard(entry) {
  const scheme = schemeCatalog[Number(entry.schemeIndex)];
  const card = document.createElement("article");
  card.className = "workspace-item tracker-card";
  card.draggable = true;
  card.dataset.trackerEntry = entry.id;
  const detail = document.createElement("div");
  appendMessage(detail, "h4", "", scheme?.name || "Scheme listing unavailable");
  appendMessage(detail, "p", "tracker-card-meta", `${scheme?.department || "Department unavailable"}${entry.reminderDate ? ` · Deadline / reminder: ${entry.reminderDate}` : ""}`);
  if (entry.notes) appendMessage(detail, "p", "tracker-card-notes", `Note: ${entry.notes}`);

  const controls = document.createElement("div");
  controls.className = "workspace-item-controls tracker-card-controls";
  const schemeLabel = document.createElement("label");
  schemeLabel.textContent = "Scheme";
  const schemeSelect = document.createElement("select");
  schemeSelect.dataset.trackerScheme = "";
  schemeSelect.setAttribute("aria-label", `Scheme for ${scheme?.name || "tracker entry"}`);
  schemeCatalog.forEach((item, index) => {
    schemeSelect.add(new Option(`${item.name} — ${item.department}`, String(index)));
  });
  schemeSelect.value = entry.schemeIndex;
  schemeLabel.append(schemeSelect);

  const statusLabel = document.createElement("label");
  statusLabel.textContent = "Pipeline stage";
  const statusSelect = document.createElement("select");
  statusSelect.dataset.trackerStatus = "";
  statusSelect.setAttribute("aria-label", `Pipeline stage for ${scheme?.name || "tracker entry"}`);
  trackerStatuses.forEach((status) => statusSelect.add(new Option(status, status)));
  statusSelect.value = entry.status;
  statusLabel.append(statusSelect);

  const noteLabel = document.createElement("label");
  noteLabel.textContent = "Notes";
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.maxLength = 300;
  noteInput.value = entry.notes || "";
  noteInput.dataset.trackerNotes = "";
  noteInput.setAttribute("aria-label", `Notes for ${scheme?.name || "tracker entry"}`);
  noteLabel.append(noteInput);

  const reminderLabel = document.createElement("label");
  reminderLabel.textContent = "Deadline / reminder";
  const reminderInput = document.createElement("input");
  reminderInput.type = "date";
  reminderInput.min = today;
  reminderInput.value = isValidDateInput(entry.reminderDate || "") ? entry.reminderDate : "";
  reminderInput.dataset.trackerDate = "";
  reminderInput.setAttribute("aria-label", `Deadline or reminder for ${scheme?.name || "tracker entry"}`);
  reminderLabel.append(reminderInput);

  const save = document.createElement("button");
  save.type = "button";
  save.dataset.saveTracker = entry.id;
  save.textContent = "Save changes";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.removeTracker = entry.id;
  remove.textContent = "Remove";
  controls.append(schemeLabel, statusLabel, noteLabel, reminderLabel, save, remove);
  card.append(detail, controls);
  return card;
}

function renderCalendarItems() {
  if (!localProfile) return;
  calendarError.hidden = true;
  const entries = getWorkspaceEntries("reminders", calendarError);
  if (!entries) return;
  calendarItems.replaceChildren();
  if (!entries.length) {
    appendWorkspaceEmpty(calendarItems, "No reminders yet. Add a personal date to keep a deadline or follow-up visible on this device.");
    return;
  }

  const upcoming = entries
    .filter((entry) => isValidDateInput(entry.date) && entry.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date));
  const past = entries
    .filter((entry) => isValidDateInput(entry.date) && entry.date < today)
    .sort((left, right) => right.date.localeCompare(left.date));

  function appendReminderGroup(title, reminders, state) {
    const group = document.createElement("section");
    group.className = "workspace-reminder-group";
    appendMessage(group, "h3", "", title);
    if (!reminders.length) {
      appendWorkspaceEmpty(group, state === "upcoming" ? "No upcoming reminders." : "No past reminders.");
    }

    reminders.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "workspace-item";
      const detail = document.createElement("div");
      appendMessage(detail, "h4", "", entry.title);
      const displayDate = new Date(`${entry.date}T00:00:00`).toLocaleDateString();
      appendMessage(detail, "p", "", `${state === "upcoming" ? "Upcoming" : "Past"} personal reminder · ${displayDate}`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.removeReminder = entry.id;
      remove.textContent = "Remove";
      card.append(detail, remove);
      group.append(card);
    });
    calendarItems.append(group);
  }

  appendReminderGroup("Upcoming reminders", upcoming, "upcoming");
  if (past.length) appendReminderGroup("Past reminders", past, "past");
}

function scrollTrackerEntryIntoView(entryId) {
  const card = [...trackerItems.querySelectorAll("[data-tracker-entry]")]
    .find((item) => item.dataset.trackerEntry === entryId);
  if (!card) return;
  const boardBounds = trackerItems.getBoundingClientRect();
  const cardBounds = card.getBoundingClientRect();
  const left = cardBounds.left - boardBounds.left + trackerItems.scrollLeft;
  const right = left + cardBounds.width;
  if (right > trackerItems.scrollLeft + trackerItems.clientWidth) {
    trackerItems.scrollLeft = right - trackerItems.clientWidth;
  } else if (left < trackerItems.scrollLeft) {
    trackerItems.scrollLeft = left;
  }
}

trackerItems.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-tracker-entry]");
  if (!card || !event.dataTransfer) return;
  event.dataTransfer.setData("text/plain", card.dataset.trackerEntry);
  event.dataTransfer.effectAllowed = "move";
});

trackerItems.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-tracker-stage]")) event.preventDefault();
});

trackerItems.addEventListener("drop", (event) => {
  const column = event.target.closest("[data-tracker-stage]");
  const entryId = event.dataTransfer?.getData("text/plain");
  if (!column || !entryId || !localProfile) return;
  event.preventDefault();
  const entries = getWorkspaceEntries("tracker", trackerError);
  if (!entries) return;
  if (!entries.some((entry) => entry.id === entryId)) return;
  if (!trackerStatuses.includes(column.dataset.trackerStage)) return;
  localProfile.tracker = entries.map((entry) => entry.id === entryId
    ? {...entry, status: column.dataset.trackerStage}
    : entry);
  if (!persistWorkspaceProfile(trackerError)) {
    localProfile.tracker = entries;
    return;
  }
  renderTrackerItems();
  scrollTrackerEntryIntoView(entryId);
  updateRoadmap();
});

trackerItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-save-tracker], button[data-remove-tracker]");
  if (!button || !localProfile) return;
  trackerError.hidden = true;
  const entries = getWorkspaceEntries("tracker", trackerError);
  if (!entries) return;
  const entry = entries.find((item) => item.id === button.dataset.saveTracker || item.id === button.dataset.removeTracker);
  if (!entry) {
    trackerError.textContent = "This tracker entry is no longer available. Refresh the page and try again.";
    trackerError.hidden = false;
    return;
  }

  let stageChanged = false;
  if (button.hasAttribute("data-remove-tracker")) {
    localProfile.tracker = entries.filter((item) => item.id !== entry.id);
  } else {
    const card = button.closest(".workspace-item");
    const schemeIndex = card.querySelector("[data-tracker-scheme]").value;
    const status = card.querySelector("[data-tracker-status]").value;
    const reminderDate = card.querySelector("[data-tracker-date]").value;
    const notes = card.querySelector("[data-tracker-notes]").value.trim();
    stageChanged = status !== entry.status;
    if (!schemeCatalog[Number(schemeIndex)] || !trackerStatuses.includes(status)) {
      trackerError.textContent = "Choose a listed scheme and a valid tracker status.";
      trackerError.hidden = false;
      return;
    }
    if (reminderDate && (!isValidDateInput(reminderDate) || reminderDate < today)) {
      trackerError.textContent = "Choose a valid reminder date that is today or later.";
      trackerError.hidden = false;
      return;
    }
    localProfile.tracker = entries.map((item) => item.id === entry.id
      ? {...item, schemeIndex, status, reminderDate, notes}
      : item);
  }

  if (!persistWorkspaceProfile(trackerError)) {
    localProfile.tracker = entries;
    return;
  }
  renderTrackerItems();
  if (stageChanged) scrollTrackerEntryIntoView(entry.id);
  updateRoadmap();
});

calendarItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-reminder]");
  if (!button || !localProfile) return;
  calendarError.hidden = true;
  const entries = getWorkspaceEntries("reminders", calendarError);
  if (!entries) return;
  localProfile.reminders = entries.filter((entry) => entry.id !== button.dataset.removeReminder);
  if (!persistWorkspaceProfile(calendarError)) {
    localProfile.reminders = entries;
    return;
  }
  renderCalendarItems();
});

trackerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  trackerError.hidden = true;
  if (!localProfile) {
    trackerError.textContent = "Create a local profile before adding tracker entries.";
    trackerError.hidden = false;
    return;
  }

  const entry = Object.fromEntries(new FormData(trackerForm).entries());
  entry.reminderDate = entry.reminderDate.trim();
  if (!schemeCatalog[Number(entry.schemeIndex)] || !trackerStatuses.includes(entry.status)) {
    trackerError.textContent = "Choose a listed scheme and a valid tracker status.";
    trackerError.hidden = false;
    return;
  }
  if (entry.reminderDate && (!isValidDateInput(entry.reminderDate) || entry.reminderDate < today)) {
    trackerError.textContent = "Choose a valid reminder date that is today or later.";
    trackerError.hidden = false;
    return;
  }
  const entries = getWorkspaceEntries("tracker", trackerError);
  if (!entries) return;
  localProfile.tracker = [...entries, {...entry, id: createEntryId()}];
  if (!persistWorkspaceProfile(trackerError)) {
    localProfile.tracker = entries;
    return;
  }
  trackerForm.reset();
  renderTrackerItems();
  updateRoadmap();
});

calendarForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calendarError.hidden = true;
  if (!localProfile) {
    calendarError.textContent = "Create a local profile before saving reminders.";
    calendarError.hidden = false;
    return;
  }

  const entry = Object.fromEntries(new FormData(calendarForm).entries());
  entry.title = entry.title.trim();
  if (!entry.title) {
    calendarError.textContent = "Enter a reminder title.";
    calendarError.hidden = false;
    return;
  }
  if (!isValidDateInput(entry.date) || entry.date < today) {
    calendarError.textContent = "Choose a valid date that is today or later.";
    calendarError.hidden = false;
    return;
  }
  const entries = getWorkspaceEntries("reminders", calendarError);
  if (!entries) return;
  localProfile.reminders = [...entries, {...entry, id: createEntryId()}];
  if (!persistWorkspaceProfile(calendarError)) {
    localProfile.reminders = entries;
    return;
  }
  calendarForm.reset();
  renderCalendarItems();
});

function populateSchemeSelect(select, placeholder) {
  const options = [new Option(placeholder, "")];
  schemeCatalog.forEach((scheme, index) => {
    options.push(new Option(`${scheme.name} — ${scheme.department}`, String(index)));
  });
  select.replaceChildren(...options);
}

function getRuleForListing(scheme) {
  if (scheme.name === verifiedEligibilityRules[0].name) return verifiedEligibilityRules[0];
  if (scheme.name.includes("Rajarshi Chhatrapati Shahu Maharaj Tuition Fee Scholarship - SEBC - Technical Education")) {
    return verifiedEligibilityRules[1];
  }
  return null;
}

function renderCompareCard(scheme) {
  const card = document.createElement("article");
  card.className = "compare-card";
  appendMessage(card, "h3", "", scheme.name);
  appendMessage(card, "p", "", `${scheme.level === "school" ? "School" : "College"} · ${scheme.department}`);
  const categories = scheme.groups.map((group) => schemeCategoryLabels.get(group) || group).join(", ");
  appendMessage(card, "p", "", `Directory categories: ${categories}`);

  const rule = getRuleForListing(scheme);
  let rate = "No official benefit percentage has been verified for this directory entry in the current VIDVATTA screener.";
  if (rule && !localProfile?.eligibility) {
    rate = "Complete your saved eligibility questions to see a published rate when the verified criteria match.";
  } else if (rule) {
    const assessment = assessRule(rule, localProfile.eligibility);
    if (assessment.status === "possible") {
      rate = rule.benefit(localProfile.eligibility);
    } else if (assessment.status === "review") {
      rate = "The benefit percentage is withheld until the remaining scheme checks can be confirmed.";
    } else {
      rate = "The saved profile does not match all the published checks; no benefit percentage is shown.";
    }
  }
  appendMessage(card, "p", "compare-rate", rate);
  const link = document.createElement("a");
  link.href = scheme.level === "school"
    ? "https://mahadbt2.maharashtra.gov.in/school-student"
    : "https://mahadbt2.maharashtra.gov.in/college-student";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Verify current details on MahaDBT ↗";
  card.append(link);
  return card;
}

compareForm.addEventListener("submit", (event) => {
  event.preventDefault();
  compareResults.replaceChildren();
  const firstIndex = Number(compareFirst.value);
  const secondIndex = Number(compareSecond.value);
  if (!Number.isInteger(firstIndex) || !Number.isInteger(secondIndex) || !schemeCatalog[firstIndex] || !schemeCatalog[secondIndex]) {
    appendMessage(compareResults, "p", "workspace-empty", "Choose two schemes to compare.");
    return;
  }
  if (firstIndex === secondIndex) {
    appendMessage(compareResults, "p", "workspace-empty", "Choose two different scheme listings to compare.");
    return;
  }
  compareResults.append(renderCompareCard(schemeCatalog[firstIndex]), renderCompareCard(schemeCatalog[secondIndex]));
});

function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

benefitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  benefitError.hidden = true;
  const values = Object.fromEntries(new FormData(benefitForm).entries());
  if (!localProfile?.eligibility) {
    benefitError.textContent = "Complete and save the eligibility questions before estimating a supported fee component.";
    benefitError.hidden = false;
    return;
  }
  const rule = verifiedEligibilityRules.find((item) => item.id === values.scheme);
  if (!rule) {
    benefitError.textContent = "Choose one of the represented rule sets.";
    benefitError.hidden = false;
    return;
  }
  if (!rule.feeRates(localProfile.eligibility)) {
    benefitError.textContent = "A published tuition and examination fee percentage is not represented for this scheme branch. Confirm the current benefit on MahaDBT.";
    benefitError.hidden = false;
    return;
  }
  const estimate = window.vidvattaEligibility.estimateFeeSupport(
    rule,
    localProfile.eligibility,
    values.tuitionFee,
    values.examFee
  );
  if (!estimate) {
    benefitError.textContent = "The selected rule set has failed or unverified eligibility checks, or an entered fee amount is invalid. No estimate is shown.";
    benefitError.hidden = false;
    return;
  }
  benefitResult.replaceChildren(
    document.createTextNode(`Indicative only: tuition component ${estimate.rates.tuition}% = ${formatRupees(estimate.tuitionEstimate)}; examination component ${estimate.rates.examination}% = ${formatRupees(estimate.examinationEstimate)}; combined estimate ${formatRupees(estimate.totalEstimate)}. Other and development fees are not included. Final benefits, payable fees, and approvals are determined through the official process. `)
  );
  const officialLink = document.createElement("a");
  officialLink.href = rule.url;
  officialLink.target = "_blank";
  officialLink.rel = "noopener noreferrer";
  officialLink.textContent = "Verify the current scheme on MahaDBT ↗";
  benefitResult.append(officialLink);
});

function setGuideAnswer(message, linkText, href) {
  guideAnswer.replaceChildren(document.createTextNode(message));
  if (!href) return;
  guideAnswer.append(document.createTextNode(" "));
  const link = document.createElement("a");
  link.href = href;
  link.textContent = linkText;
  if (href.startsWith("https://")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  guideAnswer.append(link);
}

const guideCopy = {
  en: {
    matches: "VIDVATTA screens only two selected MahaDBT rule sets. Your category, course, income, and answers are compared with the represented checks; missing details stay unverified. A possible match is not an approval.",
    documents: "The checklist is limited to the two represented schemes. Marking items records preparation check marks only; no files, document numbers, or personal document metadata are stored. Confirm the current list on MahaDBT.",
    percentage: "A benefit percentage applies to a fee component in a published tentative benefit table. It is not a probability of receiving a scholarship. The estimate uses only tuition and examination amounts you enter and is not an approved amount.",
    official: "VIDVATTA is independent guidance. Check current scheme rules and submit applications only through Maharashtra's official MahaDBT portal.",
    status: "Move each manually tracked scheme through the six local stages. Add a personal note or deadline and save it on this device. VIDVATTA does not fetch application status or send notifications."
  },
  mr: {
    matches: "VIDVATTA येथे निवडक MahaDBT नियमसंचांपैकी फक्त दोन तपासले जातात. तुमची प्रवर्ग, अभ्यासक्रम, उत्पन्न आणि उत्तरे उपलब्ध अटींशी तुलना केली जातात; अपूर्ण माहिती 'पडताळणी आवश्यक' राहते. संभाव्य जुळणी म्हणजे मंजुरी नाही.",
    documents: "ही यादी फक्त येथे दर्शविलेल्या दोन योजनांसाठी आहे. खूण केल्याने तयारीची स्थितीच जतन होते; फाइल, कागदपत्र क्रमांक किंवा वैयक्तिक कागदपत्र माहिती साठवली जात नाही. MahaDBT वर सध्याची यादी तपासा.",
    percentage: "लाभाची टक्केवारी प्रकाशित तात्पुरत्या लाभ तक्त्यातील शुल्काच्या घटकावर लागू होते. ती शिष्यवृत्ती मिळण्याची शक्यता नाही. अंदाज फक्त तुम्ही दिलेल्या शिक्षण शुल्क आणि परीक्षा शुल्कावर आधारित असतो; तो मंजूर रक्कम नाही.",
    official: "VIDVATTA हे स्वतंत्र मार्गदर्शन व्यासपीठ आहे. सध्याचे नियम तपासा आणि अर्ज फक्त महाराष्ट्राच्या अधिकृत MahaDBT पोर्टलवर सादर करा.",
    status: "प्रत्येक योजनेची स्थिती सहा स्थानिक टप्प्यांमधून बदला. वैयक्तिक नोंद किंवा अंतिम तारीख जोडा; ती या उपकरणावर जतन होईल. VIDVATTA अर्जाची स्थिती मिळवत नाही किंवा सूचना पाठवत नाही."
  }
};

guideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = guideForm.elements.namedItem("question").value;
  const language = guideForm.elements.namedItem("language").value;
  const linkCopy = {
    en: {
      matches: ["Open Eligibility Intelligence →", "#eligibility"],
      documents: ["Open Document Assistant →", "#documents"],
      percentage: ["Open the benefit estimate →", "#compare"],
      official: ["Open official MahaDBT ↗", "https://mahadbt2.maharashtra.gov.in/"],
      status: ["Open Application Tracker →", "#tracker"]
    },
    mr: {
      matches: ["पात्रता मार्गदर्शन उघडा →", "#eligibility"],
      documents: ["कागदपत्र सहाय्यक उघडा →", "#documents"],
      percentage: ["लाभ अंदाज उघडा →", "#compare"],
      official: ["अधिकृत MahaDBT उघडा ↗", "https://mahadbt2.maharashtra.gov.in/"],
      status: ["अर्ज ट्रॅकर उघडा →", "#tracker"]
    }
  };
  const [linkText, href] = linkCopy[language][question];
  setGuideAnswer(guideCopy[language][question], linkText, href);
});

function updateRoadmap() {
  function updateRecommendedAction(item) {
    roadmapNextAction.replaceChildren();
    if (!item) {
      roadmapNextAction.textContent = "Your listed journey steps are complete. Keep checking MahaDBT for current scheme rules and deadlines.";
      return;
    }

    const heading = item.querySelector("h3").textContent;
    roadmapNextAction.append(document.createTextNode(`Next recommended action: ${heading}. `));
    const sourceLink = item.querySelector(".roadmap-action");
    if (!sourceLink) return;
    const link = document.createElement("a");
    link.href = sourceLink.href;
    link.textContent = sourceLink.textContent;
    if (sourceLink.target === "_blank") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    roadmapNextAction.append(link);
  }

  if (!localProfile) {
    roadmapItems.forEach((item, index) => {
      item.classList.toggle("is-next", index === 0);
      item.classList.remove("is-complete");
      item.querySelector(".roadmap-marker").textContent = String(index + 1);
      item.querySelector(".roadmap-status").textContent = index === 0 ? "Next up" : "Not started";
    });
    updateRecommendedAction(roadmapItems[0]);
    return;
  }

  const checklist = localProfile.documentChecks?.[documentScheme.value] || {};
  const checklistItems = schemeDocuments[documentScheme.value] || [];
  const tracker = Array.isArray(localProfile.tracker) ? localProfile.tracker : [];
  const completed = {
    profile: Boolean(localProfile.profileDetails),
    discover: Boolean(localProfile.discoverViewed || localProfile.eligibility),
    eligibility: Boolean(localProfile.eligibility),
    documents: checklistItems.length > 0 && checklistItems.every((_, index) => Boolean(checklist[index])),
    official: Boolean(localProfile.officialPortalOpened),
    apply: tracker.some((entry) => entry.status === "Submitted"),
    track: tracker.length > 0
  };
  const steps = roadmapItems.map((item) => item.dataset.roadmapStep);
  const nextIndex = steps.findIndex((step) => !completed[step]);

  roadmapItems.forEach((item, index) => {
    const isComplete = completed[steps[index]];
    const isNext = index === nextIndex;
    item.classList.toggle("is-complete", isComplete);
    item.classList.toggle("is-next", !isComplete && isNext);
    item.querySelector(".roadmap-marker").textContent = isComplete ? "✓" : String(index + 1);
    item.querySelector(".roadmap-status").textContent = isComplete ? "Complete" : isNext ? "Next up" : "Not started";
  });
  updateRecommendedAction(nextIndex < 0 ? null : roadmapItems[nextIndex]);
}

document.querySelectorAll("[data-open-official-portal]").forEach((officialRoadmapLink) => {
  officialRoadmapLink.addEventListener("click", () => {
  if (!localProfile) return;
  localProfile.officialPortalOpened = true;
  persistWorkspaceProfile(roadmapError);
  updateRoadmap();
  });
});

populateSchemeSelect(document.querySelector("#tracker-scheme"), "Choose a scheme");
populateSchemeSelect(compareFirst, "Choose a first scheme");
populateSchemeSelect(compareSecond, "Choose a second scheme");
guideForm.addEventListener("input", () => {
  guideAnswer.textContent = guideForm.elements.namedItem("language").value === "mr"
    ? "प्रश्न निवडा आणि मार्गदर्शन दाखवण्यासाठी बटण निवडा."
    : "Choose a question and select “Show guidance” to display a sourced next step.";
  guideForm.querySelector("button[type='submit']").textContent = guideForm.elements.namedItem("language").value === "mr"
    ? "मार्गदर्शन दाखवा"
    : "Show guidance";
});
eligibilityForm.elements.namedItem("track").addEventListener("change", setConditionalCriteria);
eligibilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  eligibilityError.hidden = true;
  if (!localProfile) {
    showEligibilityError("Create a local profile before saving eligibility details.");
    return;
  }

  const answers = Object.fromEntries(new FormData(eligibilityForm).entries());
  localProfile = {...localProfile, eligibility: answers};
  if (localProfile.profileDetails) {
    localProfile.profileDetails = {
      ...localProfile.profileDetails,
      course: answers.track,
      category: answers.category,
      familyIncome: answers.familyIncome,
      state: answers.maharashtraDomicile === "yes"
        ? "Maharashtra"
        : answers.maharashtraDomicile === "no"
          ? "Other"
          : localProfile.profileDetails.state
    };
  }
  if (!saveLocalProfile()) {
    showEligibilityError("The answers could not be saved. Check browser storage settings and try again.");
    return;
  }
  renderEligibilityResults(answers);
  fillProfileDetailsForm();
  profileDisplayLocation.textContent = [localProfile.profileDetails?.district, localProfile.profileDetails?.state].filter(Boolean).join(", ") || "Add your district and state";
  updateDocumentSchemeFromProfile();
  renderDocumentChecklist();
  updateRoadmap();
});
document.querySelector("#edit-account").addEventListener("click", openAccountDialog);
setConditionalCriteria();
updateProfileUI();
