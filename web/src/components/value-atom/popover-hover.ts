// Progressive enhancement only: the "desktop hover" half of "desktop hover,
// mobile sheet". Click/tap/Enter/Space already open every popover on this
// page natively via `popovertarget` — nothing here is required for the
// popovers to work, only for them to also open on hover on a fine-pointer,
// hover-capable device. One shared listener set for every value atom on the
// page, not one per instance.
const HOVER_CAPABLE = window.matchMedia('(hover: hover) and (pointer: fine)');
const CLOSE_DELAY_MS = 150;

const closeTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function popoverFor(trigger: Element): HTMLElement | null {
  const targetId = trigger.getAttribute('popovertarget');
  return targetId ? document.getElementById(targetId) : null;
}

function cancelClose(popover: HTMLElement) {
  const timer = closeTimers.get(popover);
  if (timer !== undefined) {
    clearTimeout(timer);
    closeTimers.delete(popover);
  }
}

function scheduleClose(popover: HTMLElement) {
  cancelClose(popover);
  closeTimers.set(
    popover,
    setTimeout(() => {
      // A click may have already closed it, or moved focus inside it in a
      // way that should keep it open — hidePopover() on an already-closed
      // popover is a no-op, not an error, so no guard is needed here.
      popover.hidePopover();
    }, CLOSE_DELAY_MS),
  );
}

function attach(trigger: HTMLElement) {
  const popover = popoverFor(trigger);
  if (!popover) return;

  trigger.addEventListener('pointerenter', () => {
    if (!HOVER_CAPABLE.matches) return;
    cancelClose(popover);
    if (!popover.matches(':popover-open')) {
      try {
        popover.showPopover();
      } catch {
        // Already open via a click, or another popover-toggle race — fine.
      }
    }
  });

  trigger.addEventListener('pointerleave', () => {
    if (!HOVER_CAPABLE.matches) return;
    scheduleClose(popover);
  });

  popover.addEventListener('pointerenter', () => cancelClose(popover));
  popover.addEventListener('pointerleave', () => {
    if (!HOVER_CAPABLE.matches) return;
    scheduleClose(popover);
  });
}

for (const trigger of document.querySelectorAll<HTMLElement>(
  '.info[popovertarget], .mark[popovertarget]',
)) {
  attach(trigger);
}
