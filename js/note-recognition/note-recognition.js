import { SampleBank } from "../../lib/byz-audio/src/SampleBank.js";
import { BasicSampler } from "../../lib/byz-audio/src/BasicSampler.js";
import { LayerSampler } from "../../lib/byz-audio/src/LayerSampler.js";
import { ScaleManager } from "../../lib/byz-audio/src/ScaleManager.js";
import * as math from "../../lib/byz-audio/src/math.js";

import { GameRound } from "./GameRound.js";

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

// Uses CSS rgb syntax
const COLORS = {
  played: "180 190 255",
  correct: "30 240 40",
  incorrect: "190 40 20",
};

const NOTE_DIV_ENABLED_CLASS = "note-div-enabled";
const GAME_IN_PROGRESS_CLASS = "game-in-progress";
const PULSE_ANIMATION_CLASS = "pulse";
const ISON_SHOW_CLASS = "show";
const ISON_VOLUME = 0.4;

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

const noteButtonContainer = document.querySelector("#note-rows");
const noteButtons = document.querySelectorAll(".note-btn");

const sampleBank = new SampleBank(
  "https://audio.byzison.xyz/",
  "manifest.json",
);
const isonSampler = new LayerSampler(sampleBank, "vox1", {
  volume: ISON_VOLUME,
  nVoices: 3,
});
const guitarSampler = new BasicSampler(sampleBank, "classical_guitar", {
  nVoices: 1,
  monophonic: true,
});
const scaleManager = new ScaleManager();
let melodySampler = guitarSampler;
let gameRound = null;

sampleBank.initialise();
isonSampler.initialise();
melodySampler.initialise();

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

async function startRound() {
  setupPanel.classList.add(GAME_IN_PROGRESS_CLASS);
  gamePanel.classList.add(GAME_IN_PROGRESS_CLASS);
  setupPanel.disabled = true;
  gamePanel.disabled = false;
  enableNoteButtons(false);

  const [notes, isonNote] = getActiveNotes();
  await loadAudio(notes, isonNote);

  console.debug(`initialise round: notes: ${notes}`);
  gameRound = new GameRound({
    melodyNotes: notes,
    isonNote: isonNote,
    nQuestions: 10,
    playIsonCallback: playIsonCallback,
    playMelodyCallback: playMelodyCallback,
    readyForAnswerCallback: readyForAnswerCallback,
    playIsonFirst: true,
  });
  await gameRound.playRound();
}

function getActiveNotes() {
  let notes = [];
  for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
    notes.push(NOTES[i]);
  }
  const isonNote = NOTES[isonNoteIndex];
  return [notes, isonNote];
}

async function loadAudio(notes, isonNote) {
  let freqs = [];
  notes.forEach((note) => {
    freqs.push(noteFrequency(note));
  });
  await Promise.all([
    melodySampler.loadSound(freqs),
    isonSampler.loadSound([noteFrequency(isonNote)]),
  ]);
}

function playIsonCallback(note) {
  isonSampler.playFrequency(noteFrequency(note));
}

function playMelodyCallback(note, flashButton) {
  melodySampler.playFrequency(noteFrequency(note));
  if (flashButton) {
    const button = document.querySelector(`#${note}-btn`);
    pulseButton(button, COLORS["played"]);
  }
}

function readyForAnswerCallback(ready) {
  enableNoteButtons(ready);
}

function enableNoteButtons(enable) {
  noteButtons.forEach((button) => {
    button.disabled = !enable;
  });
}

function pulseButton(button, color) {
  button.style.setProperty("--pulse-color", color);
  button.classList.remove(PULSE_ANIMATION_CLASS);
  void button.offsetWidth;
  button.classList.add(PULSE_ANIMATION_CLASS);
}

function noteFrequency(note) {
  let octave = 0;
  if (["low-ga", "low-di", "low-ke", "zo-flat", "zo"].includes(note)) {
    octave = -1;
  } else if (
    ["high-ni", "high-pa", "high-bou", "high-ga", "high-di"].includes(note)
  ) {
    octave = 1;
  }
  return scaleManager.getFreq(
    note.replace("high-", "").replace("low-", "").replace("-", "_"),
    octave,
  );
}

function stopGame() {
  setupPanel.classList.remove(GAME_IN_PROGRESS_CLASS);
  gamePanel.classList.remove(GAME_IN_PROGRESS_CLASS);
  setupPanel.disabled = false;
  gamePanel.disabled = true;
  enableNoteButtons(true);
  isonSampler.stop();
  melodySampler.stop();
  gameRound.stop();
  gameRound = null;
}

if (window.matchMedia("(pointer: coarse)").matches) {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("touchend", () => {
      button.blur();
      console.log(button.id);
    });
  });
}

lowestDownBtn.addEventListener("click", () => {
  if (lowestNoteIndex === 0) {
    console.error("Tried to lower lowestNoteIndex below 0!");
    return;
  }
  lowestNoteIndex -= 1;
  enableNote(lowestNoteIndex);
});

lowestUpBtn.addEventListener("click", () => {
  if (lowestNoteIndex + 1 === highestNoteIndex) {
    console.error("Tried to raise lowestNoteIndex equal to highestNoteIndex!");
    return;
  }
  lowestNoteIndex += 1;
  enableNote(lowestNoteIndex - 1, false);
  if (isonNoteIndex < lowestNoteIndex) {
    setIsonNote(lowestNoteIndex);
  }
});

highestDownBtn.addEventListener("click", () => {
  if (highestNoteIndex - 1 === lowestNoteIndex) {
    console.error("Tried to lower highestNoteIndex equal to lowestNoteIndex!");
    return;
  }
  highestNoteIndex -= 1;
  enableNote(highestNoteIndex + 1, false);
  if (isonNoteIndex > highestNoteIndex) {
    setIsonNote(highestNoteIndex);
  }
});

highestUpBtn.addEventListener("click", () => {
  if (highestNoteIndex > NOTES.length) {
    console.error(`Tried to raise highestNoteIndex past ${NOTES.length}!`);
    return;
  }
  highestNoteIndex += 1;
  enableNote(highestNoteIndex);
});

isonDownBtn.addEventListener("click", () => {
  if (isonNoteIndex === lowestNoteIndex) {
    console.error(`Tried to lower ison below lowestNoteIndex!`);
    return;
  }
  setIsonNote(isonNoteIndex - 1);
});

isonUpBtn.addEventListener("click", () => {
  if (isonNoteIndex === highestNoteIndex) {
    console.error(`Tried to raise ison above highestNoteIndex!`);
    return;
  }
  setIsonNote(isonNoteIndex + 1);
});

setupPanel.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  if (
    [
      "highest-down-btn",
      "highest-up-btn",
      "lowest-down-btn",
      "lowest-up-btn",
      "ison-down-btn",
      "ison-up-btn",
    ].includes(button.id)
  ) {
    loadAudio(...getActiveNotes());
    calculateNoteControlButtons();
  }
});

startBtn.addEventListener("click", async () => {
  await startRound();
});

stopBtn.addEventListener("click", () => {
  stopGame();
});

noteButtonContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const note = button.id.replace("-btn", "");
  if (gameRound != null) {
    const [valid, correct] = gameRound.submitAnswer(note);
    if (valid) {
      if (correct) {
        pulseButton(button, COLORS["correct"]);
      } else {
        pulseButton(button, COLORS["incorrect"]);
      }
    }
  } else {
    melodySampler.playFrequency(noteFrequency(note));
  }
});

let lowestNoteIndex = indexOfNote("ni");
let highestNoteIndex = indexOfNote("pa");
let isonNoteIndex = lowestNoteIndex;

setIsonNote(isonNoteIndex);
for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
  enableNote(i);
}

loadAudio(...getActiveNotes());
calculateNoteControlButtons();
