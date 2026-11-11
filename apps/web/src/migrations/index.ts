import * as migration_20261111_090618_initial from './20261111_090618_initial';

export const migrations = [
  {
    up: migration_20261111_090618_initial.up,
    down: migration_20261111_090618_initial.down,
    name: '20261111_090618_initial'
  },
];
