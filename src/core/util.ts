export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 把数字格式化为简洁显示 */
export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 10_000) return (n / 1000).toFixed(1) + 'K';
  if (abs >= 100) return Math.round(n).toString();
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

export function fmtSigned(n: number): string {
  const s = fmt(n);
  return n >= 0 ? '+' + s : s;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return Math.round(sec) + ' 秒';
  if (sec < 3600) return Math.floor(sec / 60) + ' 分钟';
  if (sec < 86400) return (sec / 3600).toFixed(1) + ' 小时';
  return (sec / 86400).toFixed(1) + ' 天';
}
