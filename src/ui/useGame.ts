import { useSyncExternalStore } from 'react';
import { getState, getVersion, subscribe } from '../store/gameStore';

/** 订阅 store 版本号；版本变化时组件重渲染并读取最新 state。 */
export function useGame() {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return getState();
}
