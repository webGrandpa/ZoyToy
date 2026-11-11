import * as migration_20261111_090618_initial from './20261111_090618_initial';
import * as migration_20261111_110818_telegram from './20261111_110818_telegram';

export const migrations = [
  {
    up: migration_20261111_090618_initial.up,
    down: migration_20261111_090618_initial.down,
    name: '20261111_090618_initial',
  },
  {
    up: migration_20261111_110818_telegram.up,
    down: migration_20261111_110818_telegram.down,
    name: '20261111_110818_telegram'
  },
];
