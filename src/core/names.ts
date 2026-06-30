const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
const GIVEN_CLEAN = '伯仲叔季文武安宁康乐丰阿大小三四五六七八九春夏秋冬山林田川';

function pick(str: string): string {
  return str[Math.floor(Math.random() * str.length)];
}

export function randomName(): string {
  const surname = pick(SURNAMES);
  const len = Math.random() < 0.5 ? 1 : 2;
  let given = '';
  for (let i = 0; i < len; i++) given += pick(GIVEN_CLEAN);
  return surname + given;
}
