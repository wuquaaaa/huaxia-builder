import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 让 Node 解析无扩展名的相对导入（追加 .ts），配合内置类型擦除运行源码
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[mc]?[jt]s$/.test(specifier)) {
    try {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(specifier + '.ts', context);
    } catch {
      /* ignore */
    }
  }
  return next(specifier, context);
}
