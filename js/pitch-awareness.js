import { SampleBank } from "../lib/byz-audio/src/SampleBank.js";
import { Sampler } from "../lib/byz-audio/src/Sampler.js";
import { ScaleManager } from "../lib/byz-audio/src/ScaleManager.js";

const NOTES = [
  "low-ga",
  "low-di",
  "low-ke",
  "zo-flat",
  "zo",
  "ni",
  "pa",
  "bou",
  "ga",
  "di",
  "ke",
  "high-zo-flat",
  "high-zo",
  "high-ni",
  "high-pa",
  "high-bou",
  "high-ga",
  "high-di",
];

let NOTE_DIV_ENABLED_CLASS = "note-div-enabled";
let GAME_IN_PROGRESS_CLASS = "game-in-progress";
let ISON_SHOW_CLASS = "show";

const setupPanel = document.querySelector("#setup-panel");
const gamePanel = document.querySelector("#game-panel");

const lowestDownBtn = document.querySelector("#lowest-down-btn");
const lowestUpBtn = document.querySelector("#lowest-up-btn");
const highestDownBtn = document.querySelector("#highest-down-btn");
const highestUpBtn = document.querySelector("#highest-up-btn");
const isonDownBtn = document.querySelector("#ison-down-btn");
const isonUpBtn = document.querySelector("#ison-up-btn");
const startBtn = document.querySelector("#start-btn");
const stopBtn = document.querySelector("#stop-btn");

const sampleBank = new SampleBank(
  "https://audio.byzison.xyz/",
  "manifest.json",
);
const isonSampler = new Sampler(sampleBank, "vox1", {
  nVoices: 3,
});
const guitarSampler = new Sampler(sampleBank, "classical_guitar", {
  nVoices: 1,
});
const scaleManager = new ScaleManager();
let melodySampler = guitarSampler;

sampleBank.initialise();
isonSampler.initialise();
guitarSampler.initialise();

function indexOfNote(note) {
  if (NOTES.includes(note)) {
    return NOTES.indexOf(note);
  }
  console.error(`Unknown note: ${note}`);
  return false;
}

function enableNote(noteIndex, enable = true) {
  const noteName = NOTES[noteIndex];
  const noteDiv = document.querySelector(`#row-${noteName}`);
  if (enable) {
    noteDiv.classList.add(NOTE_DIV_ENABLED_CLASS);
  } else {
    noteDiv.classList.remove(NOTE_DIV_ENABLED_CLASS);
  }
}

function setIsonNote(noteIndex) {
  const oldNoteName = NOTES[isonNoteIndex];
  const oldIsonSlot = document.querySelector(`#row-${oldNoteName} .ison-slot`);
  oldIsonSlot.classList.remove(ISON_SHOW_CLASS);
  isonNoteIndex = noteIndex;
  const newNoteName = NOTES[isonNoteIndex];
  const newIsonSlot = document.querySelector(`#row-${newNoteName} .ison-slot`);
  newIsonSlot.classList.add(ISON_SHOW_CLASS);
}

function calculateNoteControlButtons() {
  highestDownBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  highestUpBtn.disabled = highestNoteIndex === NOTES.length - 1;
  lowestDownBtn.disabled = lowestNoteIndex === 0;
  lowestUpBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  isonDownBtn.disabled = isonNoteIndex === lowestNoteIndex;
  isonUpBtn.disabled = isonNoteIndex === highestNoteIndex;
}

async function startGame() {
  setupPanel.classList.add(GAME_IN_PROGRESS_CLASS);
  gamePanel.classList.add(GAME_IN_PROGRESS_CLASS);

  let notes = [];
  for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
    notes.push(NOTES[i]);
  }
  console.debug(`start game: notes: ${notes}`);
  const noteFreqs = calculateNoteFrequencies(notes);
  console.debug(noteFreqs);
  let freqs = [];
  noteFreqs.forEach((freq, note, map) => {
    freqs.push(freq);
  });
  await melodySampler.loadSound(freqs);
  console.log("Sounds loaded");
}

function calculateNoteFrequencies(notes) {
  let noteFreqs = new Map();
  notes.forEach((note) => {
    let octave = 0;
    if (["low-ga", "low-di", "low-ke", "zo-flat", "zo"].includes(note)) {
      octave = -1;
    } else if (
      ["high-ni", "high-pa", "high-bou", "high-ga", "high-di"].includes(note)
    ) {
      octave = 1;
    }
    const freq = scaleManager.getFreq(
      note.replace("high-", "").replace("low-", "").replace("-", "_"),
      octave,
    );
    noteFreqs.set(note, freq);
  });
  return noteFreqs;
}

function stopGame() {
  setupPanel.classList.remove(GAME_IN_PROGRESS_CLASS);
  gamePanel.classList.remove(GAME_IN_PROGRESS_CLASS);
}

lowestDownBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (lowestNoteIndex === 0) {
    console.error("Tried to lower lowestNoteIndex below 0!");
    return;
  }
  lowestNoteIndex -= 1;
  enableNote(lowestNoteIndex);
  calculateNoteControlButtons();
});

lowestUpBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (lowestNoteIndex + 1 === highestNoteIndex) {
    console.error("Tried to raise lowestNoteIndex equal to highestNoteIndex!");
    return;
  }
  lowestNoteIndex += 1;
  enableNote(lowestNoteIndex - 1, false);
  if (isonNoteIndex < lowestNoteIndex) {
    setIsonNote(lowestNoteIndex);
  }
  calculateNoteControlButtons();
});

highestDownBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (highestNoteIndex - 1 === lowestNoteIndex) {
    console.error("Tried to lower highestNoteIndex equal to lowestNoteIndex!");
    return;
  }
  highestNoteIndex -= 1;
  enableNote(highestNoteIndex + 1, false);
  if (isonNoteIndex > highestNoteIndex) {
    setIsonNote(highestNoteIndex);
  }
  calculateNoteControlButtons();
});

highestUpBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (highestNoteIndex > NOTES.length) {
    console.error(`Tried to raise highestNoteIndex past ${NOTES.length}!`);
    return;
  }
  highestNoteIndex += 1;
  enableNote(highestNoteIndex);
  calculateNoteControlButtons();
});

isonDownBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (isonNoteIndex === lowestNoteIndex) {
    console.error(`Tried to lower ison below lowestNoteIndex!`);
    return;
  }
  setIsonNote(isonNoteIndex - 1);
  calculateNoteControlButtons();
});

isonUpBtn.addEventListener("click", () => {
  event.stopPropagation();
  if (isonNoteIndex === highestNoteIndex) {
    console.error(`Tried to raise ison above highestNoteIndex!`);
    return;
  }
  setIsonNote(isonNoteIndex + 1);
  calculateNoteControlButtons();
});

startBtn.addEventListener("click", () => {
  startGame();
});

stopBtn.addEventListener("click", () => {
  stopGame();
});

let lowestNoteIndex = indexOfNote("ni");
let highestNoteIndex = indexOfNote("pa");
let isonNoteIndex = lowestNoteIndex;

for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
  enableNote(i);
}
setIsonNote(isonNoteIndex);
calculateNoteControlButtons();
