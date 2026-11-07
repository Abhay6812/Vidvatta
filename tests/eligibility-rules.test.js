const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const {rules, assess, match, estimateFeeSupport} = require("../eligibility-rules.js");

function stProfile(overrides = {}) {
  return {
    category: "st",
    track: "vocational",
    currentlyEnrolled: "yes",
    maharashtraDomicile: "yes",
    familyIncome: "300000",
    withinFirstTwo: "yes",
    sscStatus: "passed",
    recognizedTraining: "yes",
    centralTrainingAdmission: "yes",
    casteValidity: "yes",
    previousTrainingBenefit: "no",
    trainingAttendance: "yes",
    ...overrides
  };
}

function sebcProfile(overrides = {}) {
  return {
    category: "sebc",
    track: "technical",
    currentlyEnrolled: "yes",
    indianNational: "yes",
    maharashtraDomicile: "yes",
    instituteType: "eligible",
    capAdmission: "yes",
    otherScholarship: "no",
    withinFirstTwo: "yes",
    familyIncome: "300000",
    technicalAttendance: "met",
    studyGap: "no",
    gender: "female",
    ...overrides
  };
}

describe("VIDVATTA eligibility rules", () => {
  it("keeps a failed SSC answer unverified and withholds a misleading rate", () => {
    const rule = rules.find((item) => item.id === "st-training");
    const result = assess(rule, stProfile({sscStatus: "failed"}));
    const sscCheck = result.unknownChecks.find((check) => check.label.includes("failed SSC"));

    assert.equal(result.status, "review");
    assert.ok(sscCheck);
    assert.doesNotMatch(rule.benefit(stProfile({sscStatus: "failed"})), /100%/);
  });

  it("does not treat blank or malformed income as zero", () => {
    const rule = rules.find((item) => item.id === "st-training");
    const blankIncome = assess(rule, stProfile({familyIncome: ""}));
    const malformedIncome = assess(rule, stProfile({familyIncome: "not-a-number"}));

    assert.equal(blankIncome.status, "review");
    assert.ok(blankIncome.unknownChecks.some((check) => check.label.includes("family income")));
    assert.equal(malformedIncome.status, "review");
    assert.ok(malformedIncome.unknownChecks.some((check) => check.label.includes("family income")));
  });

  it("evaluates coarse income bands conservatively at verified scheme limits", () => {
    const stRule = rules.find((item) => item.id === "st-training");
    const sebcRule = rules.find((item) => item.id === "sebc-technical");
    const stUnder250k = assess(stRule, stProfile({familyIncome: "0-250000"}));
    const stOver250k = assess(stRule, stProfile({familyIncome: "250001-800000"}));
    const stOver800k = assess(stRule, stProfile({familyIncome: "800001+"}));
    const sebcUnder800k = assess(sebcRule, sebcProfile({familyIncome: "250001-800000"}));
    const sebcOver800k = assess(sebcRule, sebcProfile({familyIncome: "800001+"}));
    const stIncomeCheck = (result) => result.checks.find((check) => check.label.includes("family income"));

    assert.equal(stIncomeCheck(stUnder250k).passed, true);
    assert.equal(stIncomeCheck(stOver250k).passed, true);
    assert.equal(stIncomeCheck(stOver800k).passed, false);
    assert.doesNotMatch(stRule.benefit(stProfile({familyIncome: "250001-800000"})), /as per the Government of India scholarship/);
    assert.equal(stIncomeCheck(sebcUnder800k).passed, true);
    assert.equal(stIncomeCheck(sebcOver800k).passed, false);
    assert.equal(stIncomeCheck(assess(sebcRule, sebcProfile({familyIncome: "unknown"}))).passed, null);
  });

  it("separates failed conditions from unknown conditions", () => {
    const rule = rules.find((item) => item.id === "sebc-technical");
    const result = assess(rule, sebcProfile({
      maharashtraDomicile: "no",
      technicalAttendance: "unknown"
    }));

    assert.equal(result.status, "not-match");
    assert.ok(result.failedChecks.some((check) => check.label === "Maharashtra domicile"));
    assert.ok(result.unknownChecks.some((check) => check.label.includes("attendance")));
  });

  it("returns explainable matches only for a represented category or study track", () => {
    const matches = match({category: "sebc", track: "technical", familyIncome: "300000"});
    const sebc = matches.find((item) => item.rule.id === "sebc-technical");
    const trackOnly = match({category: "open", track: "technical"})
      .find((item) => item.rule.id === "sebc-technical");

    assert.equal(matches.length, 1);
    assert.deepEqual(sebc.matchedScope, {category: true, studyTrack: true});
    assert.deepEqual(trackOnly.matchedScope, {category: false, studyTrack: true});
    assert.equal(match({category: "open", track: "other"}).length, 0);
  });

  it("shows a benefit table only after every represented SEBC check passes", () => {
    const rule = rules.find((item) => item.id === "sebc-technical");
    const result = assess(rule, sebcProfile());

    assert.equal(result.status, "possible");
    assert.equal(result.failedChecks.length, 0);
    assert.equal(result.unknownChecks.length, 0);
    assert.match(rule.benefit(sebcProfile()), /100% of tuition fee/);
  });

  it("calculates only the supported fee components for a fully matched SEBC profile", () => {
    const rule = rules.find((item) => item.id === "sebc-technical");
    const estimate = estimateFeeSupport(rule, sebcProfile(), "60000", "4000");

    assert.deepEqual(estimate, {
      rates: {tuition: 100, examination: 100, other: 0, development: 0},
      tuitionEstimate: 60000,
      examinationEstimate: 4000,
      totalEstimate: 64000
    });
    assert.equal(estimateFeeSupport(rule, sebcProfile({gender: "male"}), 60000, 4000).totalEstimate, 32000);
  });

  it("withholds estimates for unverified criteria, unsupported rules, and invalid amounts", () => {
    const sebcRule = rules.find((item) => item.id === "sebc-technical");
    const stRule = rules.find((item) => item.id === "st-training");

    assert.equal(estimateFeeSupport(sebcRule, sebcProfile({capAdmission: "unknown"}), 60000, 4000), null);
    assert.equal(estimateFeeSupport(stRule, stProfile(), 60000, 4000), null);
    assert.equal(estimateFeeSupport(sebcRule, sebcProfile(), "", 4000), null);
    assert.equal(estimateFeeSupport(sebcRule, sebcProfile(), -1, 4000), null);
    assert.equal(estimateFeeSupport(sebcRule, sebcProfile(), 1000000001, 4000), null);
  });
});
