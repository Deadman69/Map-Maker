import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './AdvancedSection.css'

export default function AdvancedSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  // Measures the content and animates an explicit pixel height rather than
  // relying on the CSS-only grid-template-rows "0fr/1fr" trick — that trick
  // turned out not to reliably re-expand after a collapse in testing
  // (verified: transitioning 0fr -> 1fr can settle back at 0). Explicit
  // measured heights are less elegant but actually correct everywhere.
  useLayoutEffect(() => {
    const body = bodyRef.current
    const inner = innerRef.current
    if (!body || !inner) return

    if (!mountedRef.current) {
      // First render: reflect defaultOpen instantly, no grow/shrink animation.
      mountedRef.current = true
      body.style.height = open ? 'auto' : '0px'
      return
    }

    if (open) {
      body.style.height = `${inner.scrollHeight}px`
      const handleEnd = (e: TransitionEvent) => {
        // Release to `auto` once settled, so content that changes size
        // later (e.g. a hint wrapping to another line) isn't clipped by a
        // now-stale fixed pixel height.
        if (e.propertyName === 'height') body.style.height = 'auto'
      }
      body.addEventListener('transitionend', handleEnd, { once: true })
      return () => body.removeEventListener('transitionend', handleEnd)
    }

    // Closing: pin to the current equivalent pixel height first (no visual
    // change, since it matches what `auto` was already rendering), force a
    // synchronous layout so the browser commits that as a real "before"
    // state (a mere style write doesn't count — without a forced reflow in
    // between, both writes can get coalesced into the same layout pass and
    // the transition never sees anything to animate from), then drop to 0.
    // Deliberately not requestAnimationFrame for the second write: this
    // pane doesn't reliably fire rAF for non-displayed/backgrounded
    // content (same reason HiddenPrintMap needs a setInterval pump rather
    // than rAF elsewhere in this codebase) — a synchronous forced reflow
    // achieves the same "commit the before-state first" effect without it.
    if (body.style.height === 'auto' || !body.style.height) {
      body.style.height = `${inner.scrollHeight}px`
    }
    void body.offsetHeight
    body.style.height = '0px'
  }, [open])

  return (
    <div className="advanced-section">
      <button
        type="button"
        className="advanced-section-toggle"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="advanced-section-chevron" aria-hidden="true">
          ⌄
        </span>
        {label}
      </button>
      <div ref={bodyRef} className="advanced-section-body" data-open={open || undefined}>
        {/* `inert` removes the collapsed content from tab order/AT — the
         * height clip alone only hides it visually, so without this,
         * focusable fields inside would still be keyboard-reachable while
         * invisible. */}
        <div ref={innerRef} id={contentId} className="advanced-section-body-inner" inert={!open}>
          {children}
        </div>
      </div>
    </div>
  )
}
