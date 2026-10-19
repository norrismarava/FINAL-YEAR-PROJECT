import { env } from "../config/env.js";
import { sweepUnansweredCalls } from "./queueService.js";

let timer = null;

// Keeps the live queue moving: re-announces unanswered calls once, then
// parks them as missed so staff never babysit a no-show.
export function startAutoMissSweeper() {
  if (timer) {
    return;
  }

  timer = setInterval(() => {
    sweepUnansweredCalls({
      secondCallAfterMs: env.autoSecondCallMs,
      autoMissAfterMs: env.autoMissAfterMs,
    }).catch((error) => {
      console.warn(`Auto-miss sweep failed: ${error.message}`);
    });
  }, env.autoMissSweepMs);

  timer.unref?.();
}
