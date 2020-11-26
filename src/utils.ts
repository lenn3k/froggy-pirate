import { User } from './models/user.model';

export function sliceData(data: string, length: number = 1024): string[] {
  const result: string[] = [];
  let index = 0;
  while (true) {
    if (index + length > data.length) {
      result.push(data.substr(index));
      break;
    }
    result.push(data.substr(index, length));
    index += length;
  }

  return result;
}

export function arrayToMessages(
  data: string[],
  length: number = 1024
): string[] {
  const result: string[] = [];
  let index = 0;

  for (let i = 0; i < data.length; i++) {
    result[index] = result[index] || '';
    if (result[index].length + data[i].length > length) {
      result[index + 1] = data[i];
      index++;
    } else {
      result[index] += data[i];
    }
  }
  return result;
}

export function calcValue(user: User): number {
  const starsNumber = Number.parseInt(user.AllianceScore, 10);
  const valueByStars = Math.floor(starsNumber * 0.15);
  const valueByTrophies = Math.floor(Number.parseInt(user.Trophy, 10) / 1000);
  return Math.max(valueByStars, valueByTrophies);
}

export function sortByStarsAndTrophy(a: User, b: User): number {
  let order = calcValue(b) - calcValue(a);
  if (order === 0) {
    order =
      Number.parseInt(b.AllianceScore, 10) -
      Number.parseInt(a.AllianceScore, 10);
  }

  if (order === 0) {
    order = Number.parseInt(b.Trophy, 10) - Number.parseInt(a.Trophy, 10);
  }

  return order;
}
