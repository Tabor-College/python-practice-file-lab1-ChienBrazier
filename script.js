const roundsInput = document.querySelector("#rounds");
const startBtn = document.querySelector("#start-btn");
const setupCard = document.querySelector("#setup-card");
const roundCard = document.querySelector("#round-card");
const resultCard = document.querySelector("#result");
const errorCard = document.querySelector("#error");
const progress = document.querySelector("#progress");
const progressFill = document.querySelector("#progress-fill");
const stepNote = document.querySelector("#step-note");
const scoreInput = document.querySelector("#score");
const ratingInput = document.querySelector("#rating");
const slopeInput = document.querySelector("#slope");
const backBtn = document.querySelector("#back-btn");
const nextBtn = document.querySelector("#next-btn");
const restartBtn = document.querySelector("#restart-btn");
const handicapValue = document.querySelector("#handicap-value");
const usedCount = document.querySelector("#used-count");
const details = document.querySelector("#details");
const surveyToggle = document.querySelector("#survey-toggle");
const surveyPanel = document.querySelector("#survey-panel");
const surveyForm = document.querySelector("#survey-form");
const surveyClose = document.querySelector("#survey-close");
const surveyStatus = document.querySelector("#survey-status");
const MAX_ROUNDS = 100;

const DIFFERENTIALS_TO_USE = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 2,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 6,
  16: 6,
  17: 7,
  18: 8,
  19: 9,
  20: 8
};

function differentialForRound(score, courseRating, slopeRating) {
  return ((score - courseRating) * 113) / slopeRating;
}

function showError(message) {
  errorCard.textContent = message;
  errorCard.classList.remove("hidden");
}

function clearError() {
  errorCard.textContent = "";
  errorCard.classList.add("hidden");
}

function calculateHandicap(rounds) {
  const differentials = rounds.map((round) =>
    differentialForRound(round.score, round.rating, round.slope)
  );

  const countToUse = differentials.length;
  const average = differentials.reduce((sum, value) => sum + value, 0) / countToUse;
  const handicapIndex = Math.floor(average * 10) / 10;

  return {
    handicapIndex,
    countToUse,
    allDifferentials: differentials,
    usedDifferentials: differentials
  };
}

let totalRounds = 0;
let currentRoundIndex = 0;
let roundsData = [];

function showSection(section) {
  section.classList.remove("hidden");
  section.classList.remove("fade-in");
  // Force reflow so animation can replay each time.
  void section.offsetWidth;
  section.classList.add("fade-in");
}

function hideSection(section) {
  section.classList.add("hidden");
}

function parseCurrentRound() {
  const score = Number(scoreInput.value);
  const rating = Number(ratingInput.value);
  const slope = Number(slopeInput.value);

  if (!Number.isFinite(score) || !Number.isFinite(rating) || !Number.isFinite(slope)) {
    return { ok: false, message: "Fill in score, course rating, and slope rating before continuing." };
  }

  if (score < 40 || score > 160) {
    return { ok: false, message: "Score must be between 40 and 160." };
  }
  if (rating < 55 || rating > 85) {
    return { ok: false, message: "Course rating must be between 55 and 85." };
  }
  if (slope < 55 || slope > 155) {
    return { ok: false, message: "Slope rating must be between 55 and 155." };
  }

  return {
    ok: true,
    data: { score, rating, slope }
  };
}

function populateRoundFields() {
  const existing = roundsData[currentRoundIndex];
  scoreInput.value = existing ? existing.score : "";
  ratingInput.value = existing ? existing.rating : "";
  slopeInput.value = existing ? existing.slope : "";
}

function hasAllRoundInputs() {
  return (
    scoreInput.value.trim() !== "" &&
    ratingInput.value.trim() !== "" &&
    slopeInput.value.trim() !== ""
  );
}

function updateNextButtonState() {
  const ready = hasAllRoundInputs();
  nextBtn.disabled = !ready;
  if (!ready) {
    stepNote.innerHTML = "Fill in all 3 boxes to enable <strong>Next Round</strong>.";
    return;
  }

  stepNote.innerHTML =
    currentRoundIndex === totalRounds - 1
      ? "Last round. Click <strong>Calculate Handicap</strong> to see your result."
      : "Enter this round values, then click <strong>Next Round</strong>.";
}

function renderRoundStep() {
  progress.textContent = `Round ${currentRoundIndex + 1} of ${totalRounds}`;
  const percent = ((currentRoundIndex + 1) / totalRounds) * 100;
  progressFill.style.width = `${percent}%`;
  backBtn.disabled = currentRoundIndex === 0;
  nextBtn.textContent = currentRoundIndex === totalRounds - 1 ? "Calculate Handicap" : "Next Round";
  populateRoundFields();
  updateNextButtonState();
}

function renderResult(result) {
  const formattedHandicap =
    result.handicapIndex < 0
      ? `+${Math.abs(result.handicapIndex).toFixed(1)}`
      : result.handicapIndex.toFixed(1);
  handicapValue.textContent = formattedHandicap;
  usedCount.textContent = `Averaged all ${result.countToUse} differential(s).`;
  const items = result.allDifferentials
    .map((value, index) => `<li>Round ${index + 1}: ${value.toFixed(1)}</li>`)
    .join("");
  details.innerHTML = `
    <p>Differentials for each round:</p>
    <ul>${items}</ul>
    <p>Lowest used: ${result.usedDifferentials.map((d) => d.toFixed(1)).join(", ")}</p>
  `;
  resultCard.classList.remove("hidden");
}

function normalizeRoundsInput() {
  let value = Number(roundsInput.value);
  if (!Number.isFinite(value)) {
    value = 8;
  }
  value = Math.min(MAX_ROUNDS, Math.max(1, Math.round(value)));
  roundsInput.value = String(value);
  return value;
}

function startFlow() {
  clearError();
  totalRounds = normalizeRoundsInput();
  currentRoundIndex = 0;
  roundsData = Array.from({ length: totalRounds }, () => null);
  hideSection(setupCard);
  hideSection(resultCard);
  showSection(roundCard);
  renderRoundStep();
}

startBtn.addEventListener("click", startFlow);

backBtn.addEventListener("click", () => {
  clearError();
  const parsed = parseCurrentRound();
  if (parsed.ok) {
    roundsData[currentRoundIndex] = parsed.data;
  }
  if (currentRoundIndex > 0) {
    currentRoundIndex -= 1;
    renderRoundStep();
  }
});

nextBtn.addEventListener("click", () => {
  clearError();
  const parsed = parseCurrentRound();
  if (!parsed.ok) {
    showError(parsed.message);
    return;
  }

  roundsData[currentRoundIndex] = parsed.data;

  if (currentRoundIndex < totalRounds - 1) {
    currentRoundIndex += 1;
    renderRoundStep();
    return;
  }

  const result = calculateHandicap(roundsData);
  hideSection(roundCard);
  showSection(resultCard);
  renderResult(result);
});

restartBtn.addEventListener("click", () => {
  clearError();
  showSection(setupCard);
  hideSection(roundCard);
  hideSection(resultCard);
  progressFill.style.width = "0%";
  roundsInput.focus();
});

[scoreInput, ratingInput, slopeInput].forEach((input) => {
  input.addEventListener("input", updateNextButtonState);
});

function openSurvey() {
  surveyPanel.classList.remove("hidden");
  surveyToggle.setAttribute("aria-expanded", "true");
}

function closeSurvey() {
  surveyPanel.classList.add("hidden");
  surveyToggle.setAttribute("aria-expanded", "false");
}

surveyToggle.addEventListener("click", () => {
  if (surveyPanel.classList.contains("hidden")) {
    openSurvey();
  } else {
    closeSurvey();
  }
});

surveyClose.addEventListener("click", closeSurvey);

surveyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = {
    rating: document.querySelector("#survey-rating").value,
    best: document.querySelector("#survey-best").value.trim(),
    improve: document.querySelector("#survey-improve").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!feedback.rating) {
    return;
  }

  const existing = JSON.parse(localStorage.getItem("golfHandicapFeedback") || "[]");
  existing.push(feedback);
  localStorage.setItem("golfHandicapFeedback", JSON.stringify(existing));

  surveyForm.reset();
  surveyStatus.classList.remove("hidden");
  setTimeout(() => {
    surveyStatus.classList.add("hidden");
    closeSurvey();
  }, 1400);
});
