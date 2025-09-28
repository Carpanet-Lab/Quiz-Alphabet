
export enum GameState {
  START,
  PLAYING,
  FINISHED,
}

export interface ExampleWord {
  mot: string;
  phrase: string;
}

export enum AnswerState {
    UNANSWERED,
    CORRECT,
    INCORRECT
}
