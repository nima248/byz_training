import * as math from "../../lib/byz-audio/src/math.js";
import * as util from "../../lib/byz-audio/src/util.js";

const RESPONSES = {
  playMelodyAgain: 0,
  answerSubmitted: 1,
};

export class GameRound {
  constructor({
    melodyNotes,
    isonNote,
    nQuestions,
    playIsonCallback,
    playMelodyCallback,
    readyForAnswerCallback,
    reportRoundStateCallback,
    questionCompleteCallback,
    playIsonFirst = true,
  }) {
    this._melodyNotes = melodyNotes;
    this._isonNote = isonNote;
    this._nQuestions = nQuestions;
    this._playIsonCallback = playIsonCallback;
    this._playMelodyCallback = playMelodyCallback;
    this._readyForAnswerCallback = readyForAnswerCallback;
    this._reportRoundStateCallback = reportRoundStateCallback;
    this._playIsonFirst = playIsonFirst;

    this._roundStarted = false;
    this._stopRound = false;
    this._waitingResolve = null;
    this._currentQuestion = 1;
    this._nAnswers = 0;
    this._nCorrectAnswers = 0;
  }

  async playRound() {
    if (this._roundStarted === true) {
      console.error(
        "Can't re-start the same GameRound object - make a new one!",
      );
      return;
    }
    this._reportRoundState();
    this._roundStarted = true;
    this._playIsonCallback(this._isonNote);
    await util.delay(1000);
    for (let qn = 0; qn < this._nQuestions; qn++) {
      if (this._stopRound) {
        return;
      }
      this._currentQuestion = qn + 1;
      this._reportRoundState();
      const note = this._melodyNotes[math.randomInt(this._melodyNotes.length)];
      await this._playQuestion(note);
      if (qn + 1 < this._nQuestions) {
        await util.delay(600);
      }
    }
    this._playIsonCallback(null);
    this._playMelodyCallback(null);
  }

  async _playQuestion(note) {
    this._questionNote = note;
    while (true) {
      this._readyForAnswerCallback(false);
      await util.delay(300);
      if (this._playIsonFirst && !this._stopRound) {
        this._playMelodyCallback(this._isonNote, true);
        await util.delay(1000);
      }
      if (this._stopRound) {
        return;
      }
      this._playMelodyCallback(this._questionNote, false);
      await util.delay(500);
      if (this._stopRound) {
        return;
      }
      this._readyForAnswerCallback(true);
      const response = await this._waitForResponse();
      if (response === RESPONSES.playMelodyAgain) {
      } else if (response === RESPONSES.answerSubmitted) {
        break;
      } else {
        console.error(
          `Received unknown response from _waitForResponse(): ${response}`,
        );
      }
    }
    if (this._stopRound) {
      return;
    }
  }

  _waitForResponse() {
    return new Promise((resolve) => {
      this._waitingResolve = resolve;
    });
  }

  submitAnswer(answerNote) {
    let valid = false;
    let correct = false;
    if (this._waitingResolve) {
      valid = true;
      this._nAnswers++;
      if (answerNote === this._questionNote) {
        correct = true;
        this._nCorrectAnswers++;
      }
      this._reportRoundState();
      this._waitingResolve(RESPONSES.answerSubmitted);
      this._waitingResolve = null;
    } else {
      console.warn("Submitted answer, but wasn't waiting for a response");
    }
    return [valid, correct];
  }

  playMelodyAgain() {
    if (this._waitingResolve) {
      this._readyForAnswerCallback(false);
      this._waitingResolve(RESPONSES.playMelodyAgain);
      this._waitingResolve = null;
    } else {
      console.warn(
        "Asked to play melody again, but wasn't waiting for a response",
      );
    }
  }

  stop() {
    this._stopRound = true;
  }

  getData() {
    return {
      totalQuestions: this._nQuestions,
      currentQuestion: this._currentQuestion,
      nAnswers: this._nAnswers,
      nCorrectAnswers: this._nCorrectAnswers,
    };
  }

  _reportRoundState() {
    this._reportRoundStateCallback(this.getData());
  }
}
