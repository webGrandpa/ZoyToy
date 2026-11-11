'use client'

import { useState } from 'react'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import type { Tier } from '@zoytoy/games/toy-drop'
import type { GameId } from '@zoytoy/games/catalog'
import { useI18n, useShop } from '../Providers'
import { GameShell, type Contact } from './GameShell'

const ICON: Record<GameId, ToyKind | 'zoy'> = { 'toy-drop': 'rocket', memory: 'puzzle', whack: 'zoy', stack: 'blocks' }
const TINT: Record<GameId, string> = { 'toy-drop': 'sky', memory: 'bubble', whack: 'sun', stack: 'mint' }

/** /play: a picker when the owner switched on more than one game, then the chosen game. */
export function PlayHub({ games, initial, tiers, practice, contact }: { games: GameId[]; initial: GameId; tiers: Tier[]; practice: boolean; contact: Contact }) {
  const { m } = useI18n()
  const { blip } = useShop()
  const [game, setGame] = useState<GameId>(initial)
  const choose = (id: GameId) => {
    if (id === game) return
    setGame(id)
    blip(700, 0.06)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('g', id)
      window.history.replaceState(null, '', url)
    } catch {
      /* ignore */
    }
  }
  return (
    <>
      {games.length > 1 ? (
        <div className="gpick" role="radiogroup" aria-label={m.games.pick}>
          {games.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={id === game} className={`gpick-card tint-${TINT[id]}`} onClick={() => choose(id)}>
              <span className="gpick-art" aria-hidden="true">{ICON[id] === 'zoy' ? <GiraffeHead /> : <ToyArt kind={ICON[id] as ToyKind} />}</span>
              <span className="gpick-tx">
                <b>{m.games.list[id].name}</b>
                <small>{m.games.list[id].short}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <GameShell key={game} game={game} tiers={tiers} practice={practice} contact={contact} />
    </>
  )
}
