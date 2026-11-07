function incomeWithinLimit(value, limit) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return numeric <= limit;

  const range = String(value).match(/^(\d+)-(\d+)$/);
  if (range) {
    const minimum = Number(range[1]);
    const maximum = Number(range[2]);
    if (maximum <= limit) return true;
    if (minimum > limit) return false;
    return null;
  }
  const minimum = String(value).match(/^(\d+)\+$/);
  if (minimum) return Number(minimum[1]) > limit ? false : null;
  return null;
}

const eligibilityRules = [
  {
    id: "st-training",
    name: "Reimbursement of Training Fees for Scheduled Tribe Students",
    category: "st",
    track: "vocational",
    department: "Tribal Development Department",
    url: "https://mahadbt2.maharashtra.gov.in/college-student",
    check(profile) {
      const yes = (value) => value === "yes" ? true : value === "no" ? false : null;
      const categoryMatch = profile.category === "prefer-not"
        ? null
        : profile.category === "st";
      const sscBranchVerified = profile.sscStatus === "passed"
        ? true
        : null;

      return [
        {label: "Belongs to the Scheduled Tribe (ST) category", passed: categoryMatch},
        {
          label: "Currently enrolled in a vocational training course",
          passed: profile.track === "vocational" ? yes(profile.currentlyEnrolled) : false
        },
        {label: "Maharashtra domicile", passed: yes(profile.maharashtraDomicile)},
        {
          label: "Annual family income is not more than ₹8 lakh",
          passed: incomeWithinLimit(profile.familyIncome, 800000)
        },
        {label: "Within the scheme's two-child limit", passed: yes(profile.withinFirstTwo)},
        {
          label: profile.sscStatus === "failed"
            ? "Eligibility and benefit branch for a failed SSC result is unverified"
            : "Passed SSC result for the represented benefit branch",
          passed: sscBranchVerified
        },
        {label: "Course is DGT / MSCVT approved", passed: yes(profile.recognizedTraining)},
        {
          label: "Admission was through the central online process, not management quota",
          passed: yes(profile.centralTrainingAdmission)
        },
        {label: "Required ST caste validity certificate is available", passed: yes(profile.casteValidity)},
        {
          label: "No prior government / private course or sponsored training benefit",
          passed: profile.previousTrainingBenefit === "no"
            ? true
            : profile.previousTrainingBenefit === "yes"
              ? false
              : null
        },
        {label: "Attendance and required exams meet course rules", passed: yes(profile.trainingAttendance)}
      ];
    },
    benefit(profile) {
      if (profile.sscStatus === "passed" && incomeWithinLimit(profile.familyIncome, 250000) === true) {
        return "MahaDBT lists the benefit as per the Government of India scholarship for this branch; it does not publish a fee-coverage percentage here.";
      }
      return "No fee-coverage percentage is shown for this profile because the applicable published benefit branch has not been verified here. Confirm it on MahaDBT.";
    },
    feeRates() {
      return null;
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
      const yes = (value) => value === "yes" ? true : value === "no" ? false : null;
      const categoryMatch = profile.category === "prefer-not"
        ? null
        : profile.category === "sebc";

      return [
        {label: "Belongs to the SEBC category", passed: categoryMatch},
        {
          label: "Currently enrolled in a professional / technical diploma, degree, or postgraduate course",
          passed: profile.track === "technical" ? yes(profile.currentlyEnrolled) : false
        },
        {label: "Indian national", passed: yes(profile.indianNational)},
        {label: "Maharashtra domicile", passed: yes(profile.maharashtraDomicile)},
        {
          label: "Institute is not a deemed or private university",
          passed: profile.instituteType === "eligible"
            ? true
            : profile.instituteType === "excluded"
              ? false
              : null
        },
        {label: "Admission was through the Centralized Admission Process (CAP)", passed: yes(profile.capAdmission)},
        {
          label: "No other scholarship or stipend",
          passed: profile.otherScholarship === "no"
            ? true
            : profile.otherScholarship === "yes"
              ? false
              : null
        },
        {label: "Within the scheme's two-child limit", passed: yes(profile.withinFirstTwo)},
        {
          label: "Annual family income is not more than ₹8 lakh",
          passed: incomeWithinLimit(profile.familyIncome, 800000)
        },
        {
          label: "At least 50% attendance in the previous semester, or fresh first-semester admission",
          passed: ["met", "first-semester"].includes(profile.technicalAttendance)
            ? true
            : profile.technicalAttendance === "below"
              ? false
              : null
        },
        {
          label: "No study gap of two or more years during the course",
          passed: profile.studyGap === "no"
            ? true
            : profile.studyGap === "yes"
              ? false
              : null
        },
        {
          label: "Gender matches a benefit rate published in the scheme table",
          passed: ["female", "male"].includes(profile.gender) ? true : null
        }
      ];
    },
    benefit(profile) {
      const rates = this.feeRates(profile);
      return `Tentative MahaDBT benefit table: ${rates.tuition}% of tuition fee and ${rates.examination}% of examination fee; 0% of other and development fees.`;
    },
    feeRates(profile) {
      const rate = profile.gender === "female" ? 100 : 50;
      return {tuition: rate, examination: rate, other: 0, development: 0};
    }
  }
];

function assessEligibilityRule(rule, profile) {
  const checks = rule.check(profile);
  const failedChecks = checks.filter((check) => check.passed === false);
  const passedChecks = checks.filter((check) => check.passed === true);
  const unknownChecks = checks.filter((check) => check.passed !== true && check.passed !== false);
  const status = failedChecks.length
    ? "not-match"
    : unknownChecks.length
      ? "review"
      : "possible";

  return {checks, failedChecks, passedChecks, unknownChecks, status};
}

function matchEligibilityRules(profile) {
  return eligibilityRules
    .filter((rule) => profile.track === rule.track || profile.category === rule.category)
    .map((rule) => ({
      rule,
      ...assessEligibilityRule(rule, profile),
      matchedScope: {
        category: profile.category === rule.category,
        studyTrack: profile.track === rule.track
      }
    }));
}

function estimateFeeSupport(rule, profile, tuitionFee, examinationFee) {
  const isValidAmount = (value) => (
    value !== null
    && value !== undefined
    && String(value).trim() !== ""
    && Number.isFinite(Number(value))
    && Number(value) >= 0
    && Number(value) <= 1000000000
  );
  if (!isValidAmount(tuitionFee) || !isValidAmount(examinationFee)) return null;
  if (assessEligibilityRule(rule, profile).status !== "possible") return null;
  if (typeof rule.feeRates !== "function") return null;

  const rates = rule.feeRates(profile);
  if (!rates) return null;
  const tuitionEstimate = Math.round(Number(tuitionFee) * rates.tuition) / 100;
  const examinationEstimate = Math.round(Number(examinationFee) * rates.examination) / 100;
  return {
    rates,
    tuitionEstimate,
    examinationEstimate,
    totalEstimate: tuitionEstimate + examinationEstimate
  };
}

const eligibilityApi = {
  rules: Object.freeze(eligibilityRules),
  assess: assessEligibilityRule,
  match: matchEligibilityRules,
  estimateFeeSupport
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = eligibilityApi;
} else {
  window.vidvattaEligibility = eligibilityApi;
}
