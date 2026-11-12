import * as migration_20261111_090618_initial from './20261111_090618_initial';
import * as migration_20261111_110818_telegram from './20261111_110818_telegram';
import * as migration_20261111_135841_store_sales_contacts_audit from './20261111_135841_store_sales_contacts_audit';
import * as migration_20261112_023041_media_backdrop from './20261112_023041_media_backdrop';
import * as migration_20261112_033154_admin_cleanup from './20261112_033154_admin_cleanup';

export const migrations = [
  {
    up: migration_20261111_090618_initial.up,
    down: migration_20261111_090618_initial.down,
    name: '20261111_090618_initial',
  },
  {
    up: migration_20261111_110818_telegram.up,
    down: migration_20261111_110818_telegram.down,
    name: '20261111_110818_telegram',
  },
  {
    up: migration_20261111_135841_store_sales_contacts_audit.up,
    down: migration_20261111_135841_store_sales_contacts_audit.down,
    name: '20261111_135841_store_sales_contacts_audit',
  },
  {
    up: migration_20261112_023041_media_backdrop.up,
    down: migration_20261112_023041_media_backdrop.down,
    name: '20261112_023041_media_backdrop',
  },
  {
    up: migration_20261112_033154_admin_cleanup.up,
    down: migration_20261112_033154_admin_cleanup.down,
    name: '20261112_033154_admin_cleanup'
  },
];
