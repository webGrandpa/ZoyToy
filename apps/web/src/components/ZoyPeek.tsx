import { GiraffeHead } from '@zoytoy/ui/Giraffe'

/**
 * Zoy peeking out of a kraft shipping box — for empty states (empty cart, nothing found, 404) and the
 * wish form. The head-only drawing standing alone looked cut off at the neck (owner, 2026-11); the box
 * front hides where the neck ends, like the toys in the category boxes.
 */
export function ZoyPeek({ className = '', label }: { className?: string; label?: string }) {
  return (
    <span className={`zoy-peek ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span className="zoy-peek__flap zoy-peek__flap--l" />
      <span className="zoy-peek__flap zoy-peek__flap--r" />
      <GiraffeHead className="zoy-peek__head" />
      <span className="zoy-peek__box">
        <i>ZOY</i>
      </span>
    </span>
  )
}
