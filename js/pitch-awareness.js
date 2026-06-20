const NOTES = [
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
];

NOTE_DIV_ENABLED_CLASS = "note-div-enabled";

const lowestDownBtn = document.querySelector("#lowest-down");
const lowestUpBtn = document.querySelector("#lowest-up");
const highestDownBtn = document.querySelector("#highest-down");
const highestUpBtn = document.querySelector("#highest-up");
const isonDownBtn = document.querySelector("#ison-down");
const isonUpBtn = document.querySelector("#ison-up");

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
    console.debug(`enabled note ${noteName}`);
  } else {
    noteDiv.classList.remove(NOTE_DIV_ENABLED_CLASS);
    console.debug(`disabled note ${noteName}`);
  }
}

function setIsonNote(noteIndex) {
  const oldNoteName = NOTES[isonNoteIndex];
  const oldIsonSlot = document.querySelector(`#row-${oldNoteName} .ison-slot`);
  oldIsonSlot.innerHTML = "";
  isonNoteIndex = noteIndex;
  const newNoteName = NOTES[isonNoteIndex];
  const newIsonSlot = document.querySelector(`#row-${newNoteName} .ison-slot`);
  newIsonSlot.innerHTML = "0";
}

function calculateNoteControlButtons() {
  highestDownBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  highestUpBtn.disabled = highestNoteIndex === NOTES.length - 1;
  lowestDownBtn.disabled = lowestNoteIndex === 0;
  lowestUpBtn.disabled = highestNoteIndex - 1 === lowestNoteIndex;
  isonDownBtn.disabled = isonNoteIndex === lowestNoteIndex;
  isonUpBtn.disabled = isonNoteIndex === highestNoteIndex;
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

let lowestNoteIndex = indexOfNote("ni");
let highestNoteIndex = indexOfNote("pa");
let isonNoteIndex = lowestNoteIndex;

console.log(lowestNoteIndex);
console.log(highestNoteIndex);

for (let i = lowestNoteIndex; i <= highestNoteIndex; i++) {
  enableNote(i);
}
setIsonNote(isonNoteIndex);
calculateNoteControlButtons();
