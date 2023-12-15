import player from "play-sound";
// const player = require("play-sound")
const p = player();

let process_number = null;

export function playSounds() {
  if (process_number) {
    process_number.kill();
  }
  process_number = p.play("/Users/xiongleixin/DeskTop/sounds.mp3");
  setTimeout(() => {
    stopSounds();
  }, 960);
}

export function stopSounds() {
  process_number && process_number.kill();
  process_number = null;
}