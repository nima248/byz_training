import * as math from "../../lib/byz-audio/src/math.js";
import * as util from "../../lib/byz-audio/src/util.js";

export class GameRound {
  constructor({
    melodyNotes,
    isonNote,
    nQuestions,
    playIsonCallback,
    playMelodyCallback,
    readyForAnswerCallback,
    playIsonFirst = true,
  }) {
    this._melodyNotes = melodyNotes;
    this._isonNote = isonNote;
    this._nQuestions = nQuestions;
    this._playIsonCallback = playIsonCallback;
    this._playMelodyCallback = playMelodyCallback;
    this._readyForAnswerCallback = readyForAnswerCallback;
    this._playIsonFirst = playIsonFirst;

    this._roundStarted = false;
    this._stopped = false;
    this._waitingResolve = null;
  }

  async playRound() {
    if (this._roundStarted === true) {
      console.error(
        "Can't re-start the same GameRound object - make a new one!",
      );
      return;
    }
    this._roundStarted = true;
    this._playIsonCallback(this._isonNote);
    for (let qn = 0; qn < this._nQuestions; qn++) {
      if (this._stopped) {
        return;
      }
      const note = this._melodyNotes[math.randomInt(this._melodyNotes.length)];
      await this._playQuestion(note);
    }
  }

  async _playQuestion(note) {
    this._questionNote = note;
    if (this._playIsonFirst && !this._stopped) {
      this._playMelodyCallback(this._isonNote, true);
      await util.delay(1000);
    }
    if (this._stopped) {
      return;
    }
    this._playMelodyCallback(this._questionNote, false);
    await util.delay(400);
    if (this._stopped) {
      return;
    }
    this._readyForAnswerCallback(true);
    await this._waitForAnswer();
    if (this._stopped) {
      return;
    }
    await util.delay(1200);
  }

  _waitForAnswer() {
    return new Promise((resolve) => {
      this._waitingResolve = resolve;
    });
  }

  submitAnswer(answerNote) {
    let valid = false;
    let correct = false;
    if (this._waitingResolve) {
      valid = true;
      if (answerNote === this._questionNote) {
        correct = true;
      }
      this._readyForAnswerCallback(false);
      this._waitingResolve();
      this._waitingResolve = null;
    } else {
      console.warn("Submitted answer, but wasn't waiting for an answer");
    }
    return [valid, correct];
  }

  stop() {
    this._stopped = true;
  }
}
