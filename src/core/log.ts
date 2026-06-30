import { LOG_MAX } from './constants';
import type { GameState, LogType } from './types';

export function pushLog(state: GameState, type: LogType, text: string): void {
  state.log.push({ ts: Date.now(), type, text });
  if (state.log.length > LOG_MAX) {
    state.log.splice(0, state.log.length - LOG_MAX);
  }
}
