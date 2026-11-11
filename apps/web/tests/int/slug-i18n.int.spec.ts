import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/slug'
import { fmt, money } from '@/i18n'
import { currentSeason } from '@/lib/season'

describe('slugify', () => {
  it('transliterates Georgian, Mtavruli and Russian', () => {
    expect(slugify('ფუმფულა დათუნია')).toBe('pumpula-datunia')
    expect(slugify('ᲐᲮᲐᲚᲘ')).toBe('akhali')
    expect(slugify('Плюшевый мишка')).toBe('plyushevyy-mishka')
    expect(slugify('Toy Story 3!')).toBe('toy-story-3')
  })
})

describe('fmt', () => {
  it('picks Russian plural forms', () => {
    const t = '{n} товар|{n} товара|{n} товаров'
    expect(fmt('ru', t, { n: 1 })).toBe('1 товар')
    expect(fmt('ru', t, { n: 3 })).toBe('3 товара')
    expect(fmt('ru', t, { n: 11 })).toBe('11 товаров')
  })
  it('picks English plural forms and keeps Georgian as is', () => {
    expect(fmt('en', '{n} item|{n} items', { n: 1 })).toBe('1 item')
    expect(fmt('en', '{n} item|{n} items', { n: 2 })).toBe('2 items')
    expect(fmt('ka', '{n} ნივთი', { n: 5 })).toBe('5 ნივთი')
  })
})

describe('money', () => {
  it('formats lari the Georgian way', () => {
    expect(money(45)).toBe('45,00 ₾')
    expect(money(1234.5)).toBe('1 234,50 ₾')
  })
})

describe('currentSeason', () => {
  it('follows the calendar in auto mode', () => {
    expect(currentSeason('auto', new Date('2026-12-28T12:00:00Z'))).toBe('ny')
    expect(currentSeason('auto', new Date('2026-07-10T12:00:00Z'))).toBe('summer')
    expect(currentSeason('auto', new Date('2026-04-10T12:00:00Z'))).toBe('none')
    expect(currentSeason('summer', new Date('2026-12-28T12:00:00Z'))).toBe('summer')
  })
})
