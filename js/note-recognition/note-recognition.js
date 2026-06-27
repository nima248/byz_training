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
  played: "140 150 215",
  correct: "30 240 40",
  incorrect: "220 40 20",
};

const GAME_INSTRUCTIONS = {
  listen: "Listen...",
  provideAnswer: "What was the second note?",
  roundComplete: "Round complete!",
};

const NOTE_DIV_ENABLED_CLASS = "note-div-enabled";
const HIDE_PANEL_CLASS = "hide-panel";
const PULSE_ANIMATION_CLASS = "pulse";
const ISON_SHOW_CLASS = "show";
const ISON_VOLUME = 0.4;
const N_QUESTIONS = 10;

const setupPanel = document.querySelector("#setup-panel");
const gamePanel = document.querySelector("#game-panel");
const postGamePanel = document.querySelector("#post-game-panel");

const highestDownBtn = document.querySelector("#highest-down-btn");
const highestUpBtn = document.querySelector("#highest-up-btn");
const highestNoteDisplay = document.querySelector("#highest-note-display");
const lowestDownBtn = document.querySelector("#lowest-down-btn");
const lowestUpBtn = document.querySelector("#lowest-up-btn");
const lowestNoteDisplay = document.querySelector("#lowest-note-display");
const isonDownBtn = document.querySelector("#ison-down-btn");
const isonUpBtn = document.querySelector("#ison-up-btn");
const isonNoteDisplay = document.querySelector("#ison-note-display");
const startBtn = document.querySelector("#start-btn");
const listenAgainButton = document.querySelector("#listen-again-btn");
const stopBtn = document.querySelector("#stop-btn");
const newRoundBtn = document.querySelector("#new-round-btn");

const noteButtonContainer = document.querySelector("#note-rows");
const noteButtons = document.querySelectorAll(".note-btn");

const gameInstructionDiv = document.querySelector("#game-instruction");
const gameData1Div = document.querySelector("#game-data-1");
const gameData2Div = document.querySelector("#game-data-2");
const postGameDataDiv = document.querySelector("#post-game-data");

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

function updateSetupPanelUI() {
  highestDownBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  highestUpBtn.disabled = highestNoteIndex === NOTES.length - 1;
  updateSetupPanelNoteDisplay(highestNoteDisplay, highestNoteIndex);
  lowestDownBtn.disabled = lowestNoteIndex === 0;
  lowestUpBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  updateSetupPanelNoteDisplay(lowestNoteDisplay, lowestNoteIndex);
  isonDownBtn.disabled = isonNoteIndex === lowestNoteIndex;
  isonUpBtn.disabled = isonNoteIndex === highestNoteIndex;
  updateSetupPanelNoteDisplay(isonNoteDisplay, isonNoteIndex);
}

function updateSetupPanelNoteDisplay(displayElement, noteIndex) {
  const noteName = NOTES[noteIndex];
  const noteBtn = document.querySelector(`#${noteName}-btn`);
  displayElement.innerHTML = noteBtn.innerHTML;
}

async function startRound() {
  showPanel(gamePanel);
  enableResponseButtons(false);
  setGameInstructions(GAME_INSTRUCTIONS.listen);

  const [notes, isonNote] = getActiveNotes();
  await loadAudio(notes, isonNote);

  console.debug(`initialise round: notes: ${notes}`);
  gameRound = new GameRound({
    melodyNotes: notes,
    isonNote: isonNote,
    nQuestions: N_QUESTIONS,
    playIsonCallback: playIsonCallback,
    playMelodyCallback: playMelodyCallback,
    readyForAnswerCallback: readyForAnswerCallback,
    reportRoundStateCallback: reportRoundStateCallback,
    playIsonFirst: true,
  });
  await gameRound.playRound();
}

function showPanel(panelDiv) {
  console.debug(`showing ${panelDiv.id}`);
  [setupPanel, gamePanel, postGamePanel].forEach((p) => {
    if (p != panelDiv) {
      p.classList.add(HIDE_PANEL_CLASS);
      p.disabled = true;
    }
  });
  panelDiv.classList.remove(HIDE_PANEL_CLASS);
  panelDiv.disabled = false;
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
  if (note) {
    isonSampler.playFrequency(noteFrequency(note));
  } else {
    isonSampler.stop();
  }
}

function playMelodyCallback(note, flashButton = false) {
  if (note) {
    melodySampler.playFrequency(noteFrequency(note));
    if (flashButton) {
      const button = document.querySelector(`#${note}-btn`);
      pulseButton(button, COLORS["played"]);
    }
  } else {
    melodySampler.stop();
  }
}

function readyForAnswerCallback(ready) {
  enableResponseButtons(ready);
  setGameInstructions(
    ready ? GAME_INSTRUCTIONS.provideAnswer : GAME_INSTRUCTIONS.listen,
  );
}

function reportRoundStateCallback(data) {
  if (data.nAnswers < data.totalQuestions) {
    gameData1Div.innerHTML = `Question ${data.currentQuestion} of ${data.totalQuestions}`;
    gameData2Div.innerHTML = `Correct: ${data.nCorrectAnswers}/${data.nAnswers}`;
  } else {
    showPanel(postGamePanel);
    const correct = data.nCorrectAnswers;
    const total = data.nAnswers;
    const percent = ((correct / total) * 100).toFixed(0);
    postGameDataDiv.textContent = `Your score:\n${correct}/${total}\n(${percent}%)`;
    stopGame();
  }
}

function setGameInstructions(instructions) {
  gameInstructionDiv.innerHTML = instructions;
}

function enableResponseButtons(enable) {
  listenAgainButton.disabled = !enable;
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
  enableResponseButtons(true);
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
    updateSetupPanelUI();
  }
});

startBtn.addEventListener("click", async () => {
  await startRound();
});

stopBtn.addEventListener("click", () => {
  stopGame();
  showPanel(setupPanel);
});

newRoundBtn.addEventListener("click", () => {
  showPanel(setupPanel);
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

listenAgainButton.addEventListener("click", () => {
  if (gameRound != null) {
    gameRound.playMelodyAgain();
  }
});

let lowestNoteIndex = indexOfNote("ni");
let highestNoteIndex = indexOfNote("pa");
let isonNoteIndex = lowestNoteIndex;

setIsonNote(isonNoteIndex);
for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
  enableNote(i);
}

showPanel(setupPanel);
loadAudio(...getActiveNotes());
updateSetupPanelUI();
