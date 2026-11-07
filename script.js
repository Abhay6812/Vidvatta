const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector("#app-sidebar");
const sidebarScrim = document.querySelector("#sidebar-scrim");
const sidebarLinks = [...document.querySelectorAll(".sidebar-navigation a")];
const pageTitle = document.querySelector("#page-title");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  sidebar.classList.toggle("is-open", !isExpanded);
  sidebarScrim.hidden = isExpanded;
});

function activateSidebarLink(link) {
  sidebarLinks.forEach((sidebarLink) => sidebarLink.removeAttribute("aria-current"));
  link.setAttribute("aria-current", "page");
  pageTitle.textContent = link.dataset.pageTitle;
}

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    activateSidebarLink(link);
    if (link.hash === "#scholarships" && localProfile) {
      localProfile.discoverViewed = true;
      persistWorkspaceProfile(roadmapError);
      updateRoadmap();
    }
    if (window.matchMedia("(max-width: 700px)").matches) {
      menuToggle.setAttribute("aria-expanded", "false");
      sidebar.classList.remove("is-open");
      sidebarScrim.hidden = true;
    }
  });
});

sidebarScrim.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  sidebar.classList.remove("is-open");
  sidebarScrim.hidden = true;
});

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
  const incomeCap = document.querySelector("#income-cap").value;
  let visibleCount = 0;

  schemeCards.forEach((card) => {
    const matchesSearch = !searchTerm || `${card.dataset.search} ${card.innerText}`.toLocaleLowerCase().includes(searchTerm);
    const matchesLevel = studyLevel === "all" || card.dataset.level === studyLevel;
    const matchesCommunity = community === "all" || card.dataset.groups.split(" ").includes(community);
    const matchesIncome = incomeCap === "all" || card.dataset.income === incomeCap;
    const isVisible = matchesSearch && matchesLevel && matchesCommunity && matchesIncome;

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
const documentNote = document.querySelector("#documents-note");
const documentsError = document.querySelector("#documents-error");
const compareForm = document.querySelector("#compare-form");
const compareFirst = document.querySelector("#compare-first");
const compareSecond = document.querySelector("#compare-second");
const compareResults = document.querySelector("#compare-results");
const guideForm = document.querySelector("#guide-form");
const guideAnswer = document.querySelector("#guide-answer");
const roadmapItems = [...document.querySelectorAll(".roadmap-item")];
const roadmapError = document.querySelector("#roadmap-error");
let localProfile = null;
let profileStorageError = null;

const verifiedEligibilityRules = [
  {
    id: "st-training",
    name: "Reimbursement of Training Fees for Scheduled Tribe Students",
    category: "st",
    track: "vocational",
    department: "Tribal Development Department",
    url: "https://mahadbt2.maharashtra.gov.in/college-student",
    check(profile) {
      const add = (label, passed) => ({label, passed});
      const yes = (value) => value === "yes" ? true : value === "no" ? false : null;
      const categoryMatch = profile.category === "prefer-not" ? null : profile.category === "st";
      return [
        add("Belongs to the Scheduled Tribe (ST) category", categoryMatch),
        add("Currently enrolled in a vocational training course", profile.track === "vocational" ? yes(profile.currentlyEnrolled) : false),
        add("Maharashtra domicile", yes(profile.maharashtraDomicile)),
        add("Annual family income is not more than ₹8 lakh", Number(profile.familyIncome) <= 800000),
        add("Within the scheme's two-child limit", yes(profile.withinFirstTwo)),
        add("SSC result is known", ["passed", "failed"].includes(profile.sscStatus) ? true : null),
        add("Course is DGT / MSCVT approved", yes(profile.recognizedTraining)),
        add("Admission was through the central online process, not management quota", yes(profile.centralTrainingAdmission)),
        add("Required ST caste validity certificate is available", yes(profile.casteValidity)),
        add("No prior government / private course or sponsored training benefit", yes(profile.previousTrainingBenefit) === null ? null : profile.previousTrainingBenefit === "no"),
        add("Attendance and required exams meet course rules", yes(profile.trainingAttendance))
      ];
    },
    benefit(profile) {
      const income = Number(profile.familyIncome);
      if (profile.sscStatus === "passed" && income <= 250000) {
        return "MahaDBT lists the benefit as per the Government of India scholarship for this branch; it does not publish a fee-coverage percentage here.";
      }
      return "Tentative benefit published by MahaDBT: 100% reimbursement of the course fee for the listed SSC / income branch.";
    }
  },
  {
    id: "sebc-technical",
    name: "Rajarshi Chhatrapati Shahu Maharaj Tuition Fee Scholarship — SEBC — Technical Education",
    category: "sebc",
    track: "technical",
    department: "Directorate of Technical Education",
    url: "https://mahadbt2.maharashtra.gov.in/college-student",
    check(profile) {
      const add = (label, passed) => ({label, passed});
      const yes = (value) => value === "yes" ? true : value === "no" ? false : null;
      const categoryMatch = profile.category === "prefer-not" ? null : profile.category === "sebc";
      return [
        add("Belongs to the SEBC category", categoryMatch),
        add("Currently enrolled in a professional / technical diploma, degree, or postgraduate course", profile.track === "technical" ? yes(profile.currentlyEnrolled) : false),
        add("Indian national", yes(profile.indianNational)),
        add("Maharashtra domicile", yes(profile.maharashtraDomicile)),
        add("Institute is not a deemed or private university", profile.instituteType === "eligible" ? true : profile.instituteType === "excluded" ? false : null),
        add("Admission was through the Centralized Admission Process (CAP)", yes(profile.capAdmission)),
        add("No other scholarship or stipend", yes(profile.otherScholarship) === null ? null : profile.otherScholarship === "no"),
        add("Within the scheme's two-child limit", yes(profile.withinFirstTwo)),
        add("Annual family income is not more than ₹8 lakh", Number(profile.familyIncome) <= 800000),
        add("At least 50% attendance in the previous semester, or fresh first-semester admission", ["met", "first-semester"].includes(profile.technicalAttendance) ? true : profile.technicalAttendance === "below" ? false : null),
        add("No study gap of two or more years during the course", yes(profile.studyGap) === null ? null : profile.studyGap === "no"),
        add("Gender matches a benefit rate published in the scheme table", ["female", "male"].includes(profile.gender) ? true : null)
      ];
    },
    benefit(profile) {
      if (profile.gender === "female") {
        return "Tentative MahaDBT benefit table: 100% of tuition fee and 100% of examination fee; 0% of other and development fees.";
      }
      return "Tentative MahaDBT benefit table: 50% of tuition fee and 50% of examination fee; 0% of other and development fees.";
    }
  }
];

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
    window.localStorage.setItem(localProfileKey, JSON.stringify(localProfile));
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

function fillEligibilityForm() {
  const details = localProfile?.profileDetails || {};
  const savedAnswers = {
    ...(details.course ? {
      track: details.course === "school" ? "other" : details.course,
      category: details.category,
      familyIncome: details.familyIncome,
      maharashtraDomicile: details.state === "Maharashtra" ? "yes" : "no"
    } : {}),
    ...(localProfile?.eligibility || {})
  };

  Object.entries(savedAnswers).forEach(([name, value]) => {
    const field = eligibilityForm.elements.namedItem(name);
    if (field && typeof value === "string") field.value = value;
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
    familyIncome: details.familyIncome || eligibility.familyIncome || ""
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

function assessRule(rule, profile) {
  const checks = rule.check(profile);
  const failedChecks = checks.filter((check) => check.passed === false);
  const unknownChecks = checks.filter((check) => check.passed !== true && check.passed !== false);
  const status = failedChecks.length ? "not-match" : unknownChecks.length ? "review" : "possible";
  return {checks, failedChecks, unknownChecks, status};
}

function renderRuleResult(rule, profile) {
  const {failedChecks, unknownChecks, status} = assessRule(rule, profile);
  const card = document.createElement("article");
  card.className = "eligibility-result";
  card.dataset.status = status;
  appendMessage(card, "h3", "", rule.name);

  const statusText = status === "possible"
    ? "Potential match — all checked criteria match; MahaDBT makes the final eligibility decision."
    : status === "review"
      ? "Needs verification — one or more answers are unknown."
      : "Does not match all published checks — this is not a decision on other schemes.";
  appendMessage(card, "p", "eligibility-status", statusText);

  if (status === "possible") {
    appendMessage(card, "p", "eligibility-rate", rule.benefit(profile));
  } else if (status === "review") {
    appendMessage(card, "p", "eligibility-explanation", "No benefit percentage is shown until the relevant published checks can be confirmed.");
  }

  const unresolvedChecks = status === "not-match" ? failedChecks : unknownChecks;
  if (unresolvedChecks.length) {
    const list = document.createElement("ul");
    unresolvedChecks.forEach((check) => {
      appendMessage(list, "li", "", `${status === "not-match" ? "Does not meet / verify: " : "Please verify: "}${check.label}`);
    });
    card.append(list);
  }

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
  const results = verifiedEligibilityRules
    .filter((rule) => profile.track === rule.track || profile.category === rule.category)
    .map((rule) => renderRuleResult(rule, profile));
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
    "This first version checks only the two schemes shown above. A missing match does not mean you are ineligible for other MahaDBT schemes. See all 74 listings and verify the current rules on the official portal."
  );
}

try {
  const storedProfile = window.localStorage.getItem(localProfileKey);
  if (storedProfile) {
    const parsedProfile = JSON.parse(storedProfile);
    if (parsedProfile && typeof parsedProfile.name === "string") {
      localProfile = parsedProfile;
    } else {
      throw new Error("The saved profile has an unexpected format. Delete it and create a new local profile.");
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
    window.localStorage.removeItem(localProfileKey);
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
    window.localStorage.setItem(localProfileKey, JSON.stringify(localProfile));
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
  documentNote.textContent = `${labels}. Checklist based on the official detail page; requirements can change. Marking an item stores only its checked state, never a document or document number.`;
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
      const checkedCount = Object.values(localProfile.documentChecks[schemeId]).filter(Boolean).length;
      documentProgress.textContent = `${checkedCount} of ${items.length} checklist items marked ready`;
      updateRoadmap();
    });
    label.append(checkbox, document.createTextNode(text));
    documentChecklist.append(label);
  });

  const checkedCount = items.filter((_, index) => Boolean(saved[index])).length;
  documentProgress.textContent = `${checkedCount} of ${items.length} checklist items marked ready`;
}

documentScheme.addEventListener("change", renderDocumentChecklist);

function getWorkspaceEntries(key, errorElement) {
  const entries = localProfile[key] || [];
  if (Array.isArray(entries)) return entries;
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
  if (!entries.length) {
    appendWorkspaceEmpty(trackerItems, "Your tracker is empty. Add a scheme and update its status yourself; this does not connect to MahaDBT.");
    return;
  }

  entries.forEach((entry) => {
    const scheme = schemeCatalog[Number(entry.schemeIndex)];
    const card = document.createElement("article");
    card.className = "workspace-item";
    const detail = document.createElement("div");
    appendMessage(detail, "h3", "", scheme?.name || "Scheme listing unavailable");
    appendMessage(detail, "p", "", `Status: ${entry.status}${entry.reminderDate ? ` · Reminder: ${entry.reminderDate}` : ""}`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeTracker = entry.id;
    remove.textContent = "Remove";
    card.append(detail, remove);
    trackerItems.append(card);
  });

  trackerItems.querySelectorAll("[data-remove-tracker]").forEach((button) => {
    button.addEventListener("click", () => {
      localProfile.tracker = entries.filter((entry) => entry.id !== button.dataset.removeTracker);
      if (persistWorkspaceProfile(trackerError)) {
        renderTrackerItems();
        updateRoadmap();
      }
    });
  });
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

  [...entries].sort((a, b) => a.date.localeCompare(b.date)).forEach((entry) => {
    const card = document.createElement("article");
    card.className = "workspace-item";
    const detail = document.createElement("div");
    appendMessage(detail, "h3", "", entry.title);
    appendMessage(detail, "p", "", `Personal reminder · ${entry.date}`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeReminder = entry.id;
    remove.textContent = "Remove";
    card.append(detail, remove);
    calendarItems.append(card);
  });

  calendarItems.querySelectorAll("[data-remove-reminder]").forEach((button) => {
    button.addEventListener("click", () => {
      localProfile.reminders = entries.filter((entry) => entry.id !== button.dataset.removeReminder);
      if (persistWorkspaceProfile(calendarError)) renderCalendarItems();
    });
  });
}

trackerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  trackerError.hidden = true;
  if (!localProfile) {
    trackerError.textContent = "Create a local profile before adding tracker entries.";
    trackerError.hidden = false;
    return;
  }

  const entry = Object.fromEntries(new FormData(trackerForm).entries());
  const entries = getWorkspaceEntries("tracker", trackerError);
  if (!entries) return;
  localProfile.tracker = [...entries, {...entry, id: createEntryId()}];
  if (!persistWorkspaceProfile(trackerError)) return;
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
  const entries = getWorkspaceEntries("reminders", calendarError);
  if (!entries) return;
  localProfile.reminders = [...entries, {...entry, id: createEntryId()}];
  if (!persistWorkspaceProfile(calendarError)) return;
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

guideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = guideForm.elements.namedItem("question").value;
  if (question === "matches") {
    setGuideAnswer(
      localProfile?.eligibility
        ? "Your local screener compares two verified rule sets only. It never predicts an award or ranks the other directory entries."
        : "Create a local profile, then complete every relevant eligibility question. Unknown answers stay unverified and do not receive a percentage.",
      "Open Eligibility Intelligence →",
      "#eligibility"
    );
  } else if (question === "documents") {
    setGuideAnswer("The checklist is based on the two verified MahaDBT scheme detail pages. It stores check marks only and never receives files or document numbers.", "Open Document Assistant →", "#documents");
  } else if (question === "percentage") {
    setGuideAnswer("A published benefit percentage describes a fee component in a tentative MahaDBT benefit table. It is not a probability of receiving a scholarship, and it is shown only when the related checks pass.");
  } else {
    setGuideAnswer("Submit applications and verify current rules only through Maharashtra's official MahaDBT portal.", "Open MahaDBT ↗", "https://mahadbt2.maharashtra.gov.in/");
  }
});

function updateRoadmap() {
  if (!localProfile) {
    roadmapItems.forEach((item, index) => {
      item.classList.toggle("is-next", index === 0);
      item.classList.remove("is-complete");
      item.querySelector(".roadmap-marker").textContent = String(index + 1);
      item.querySelector(".roadmap-status").textContent = index === 0 ? "Next up" : "Not started";
    });
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
}

const officialRoadmapLink = document.querySelector('[data-roadmap-step="official"] .roadmap-action');
officialRoadmapLink.addEventListener("click", () => {
  if (!localProfile) return;
  localProfile.officialPortalOpened = true;
  persistWorkspaceProfile(roadmapError);
  updateRoadmap();
});

populateSchemeSelect(document.querySelector("#tracker-scheme"), "Choose a scheme");
populateSchemeSelect(compareFirst, "Choose a first scheme");
populateSchemeSelect(compareSecond, "Choose a second scheme");
guideForm.addEventListener("input", () => {
  guideAnswer.textContent = "Choose a question and select “Show guidance” to display a sourced next step.";
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
