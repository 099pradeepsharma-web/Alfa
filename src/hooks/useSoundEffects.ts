import { Howl } from 'howler';

const sounds = {
  correct: new Howl({ src: ['/sounds/correct.mp3'] }),
  wrong: new Howl({ src: ['/sounds/wrong.mp3'] }),
  reward: new Howl({ src: ['/sounds/reward.mp3'] }),
};

export function useSoundEffects() {
  const playCorrect = () => sounds.correct.play();
  const playWrong = () => sounds.wrong.play();
  const playReward = () => sounds.reward.play();
  return { playCorrect, playWrong, playReward };
}
