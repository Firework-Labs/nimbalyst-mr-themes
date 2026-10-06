import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

export function Icon({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="nte-icon" aria-hidden style={{ fontSize: size, ...style }}>
      {name}
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: string;
  children?: ReactNode;
}

export function Button({ variant = 'default', size = 'md', icon, children, className, ...rest }: ButtonProps) {
  const cls = ['nte-btn', variant !== 'default' ? variant : '', size === 'sm' ? 'sm' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, title }: { on: boolean; onChange: (v: boolean) => void; title?: string }) {
  return (
    <button
      type="button"
      className={`nte-toggle${on ? ' on' : ''}`}
      role="switch"
      aria-checked={on}
      title={title}
      onClick={() => onChange(!on)}
    />
  );
}

export function Pill({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={`nte-pill${on ? ' on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** A titled section divider: title, optional one-line hint, then a rule. */
export function SectionHead({ title, hint, right }: { title: string; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div className="nte-sectionhead">
      <div className="sh-top">
        <h3>{title}</h3>
        {hint ? <span className="sh-hint">{hint}</span> : null}
        {right ? <span className="sh-right">{right}</span> : null}
      </div>
      <div className="sh-rule" />
    </div>
  );
}

export type MenuItem =
  | { kind?: 'item'; label: string; icon?: string; onSelect: () => void; checked?: boolean; danger?: boolean; disabled?: boolean }
  | { kind: 'group'; label: string }
  | { kind: 'sep' };

/**
 * A "…" button that opens an action menu. Same placement rules as
 * ThemePicker: fixed-position popover from the button rect (the grid and tray
 * clip overflow and there is no portal), closes on outside click, Escape,
 * scroll, resize, or after an item runs. Arrow keys move between items.
 */
export function MenuButton({ items, ariaLabel, title, icon = 'more_horiz' }: { items: MenuItem[]; ariaLabel: string; title?: string; icon?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; maxHeight: number; top?: number; bottom?: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const WIDTH = 240;

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const down = below >= 260 || below >= above;
    const left = Math.max(8, Math.min(r.right - WIDTH, window.innerWidth - WIDTH - 8));
    const maxHeight = Math.max(140, Math.min(460, down ? below : above));
    setPos(down ? { left, maxHeight, top: Math.round(r.bottom + 4) } : { left, maxHeight, bottom: Math.round(window.innerHeight - r.top + 4) });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onMove = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    listRef.current?.querySelector<HTMLElement>('button.mn-item:not(:disabled)')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const onListKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const btns = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button.mn-item:not(:disabled)') ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    const n = btns.length;
    if (n) btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n].focus();
  };

  return (
    <div ref={rootRef} className={`nte-menu${open ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button ref={btnRef} type="button" className="nte-menubtn" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} title={title ?? ariaLabel} onClick={() => (open ? setOpen(false) : openMenu())}>
        <Icon name={icon} size={18} />
      </button>
      {open && pos ? (
        <div ref={listRef} className="nte-menupop" role="menu" aria-label={ariaLabel} onKeyDown={onListKey} style={{ left: pos.left, width: WIDTH, maxHeight: pos.maxHeight, top: pos.top, bottom: pos.bottom }}>
          {items.map((it, i) => {
            if (it.kind === 'sep') return <div key={i} className="mn-sep" role="separator" />;
            if (it.kind === 'group') return <div key={i} className="mn-group">{it.label}</div>;
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={`mn-item${it.danger ? ' danger' : ''}`}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
              >
                <Icon name={it.icon ?? 'blank'} size={16} style={it.icon ? undefined : { visibility: 'hidden' }} />
                <span className="mn-label">{it.label}</span>
                {it.checked ? <Icon name="check" size={15} style={{ marginLeft: 'auto' }} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export interface PickerOption {
  value: string;
  /** Text shown in the button and in the list. */
  label: string;
  /** Optional heading this option is filed under. Ungrouped options are listed first. */
  group?: string;
}

interface ThemePickerProps {
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  /** Shown when no option matches `value` (used by the "Use for project…" action picker). */
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Replacement for a native <select>. Nimbalyst's global form styles make real
 * selects illegible at rest, so this is a plain button plus a popover list.
 *
 * The popover is `position: fixed` and placed from the button's rect: the
 * gallery cards and the assignment tray are both inside scroll/overflow
 * containers that would clip an absolutely positioned menu, and no portal is
 * available (this bundle has no react-dom). It closes on outside click, on
 * Escape, and on any scroll or resize.
 */
export function ThemePicker({ value, options, onChange, placeholder, ariaLabel, title, size = 'md', className }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; width: number; maxHeight: number; top?: number; bottom?: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const out: { name: string | null; items: PickerOption[] }[] = [];
    for (const o of options) {
      const name = o.group ?? null;
      let g = out.find((x) => x.name === name);
      if (!g) {
        g = { name, items: [] };
        out.push(g);
      }
      g.items.push(o);
    }
    return out;
  }, [options]);
  const ordered = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const indexOf = useMemo(() => new Map(ordered.map((o, i) => [o.value, i] as const)), [ordered]);

  const current = options.find((o) => o.value === value) ?? null;
  const selectedIndex = current ? indexOf.get(current.value) ?? -1 : -1;

  const place = () => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const down = below >= 200 || below >= above;
    const width = Math.max(r.width, 210);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const maxHeight = Math.max(120, Math.min(340, down ? below : above));
    setPos(down
      ? { left, width, maxHeight, top: Math.round(r.bottom + 4) }
      : { left, width, maxHeight, bottom: Math.round(window.innerHeight - r.top + 4) });
  };

  const openMenu = () => {
    place();
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) btnRef.current?.focus();
  };

  const commit = (v: string) => {
    setOpen(false);
    btnRef.current?.focus();
    onChange(v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    // A capture listener on window also receives scroll events from the list
    // itself; closing on those made long lists unusable (the popover closed as
    // soon as it scrolled to the selected theme, or on the first wheel turn).
    const onMove = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  // Keep the active option in view by scrolling the list only; scrollIntoView
  // can also scroll the gallery or tray behind the popover, which closes it.
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (!list || !el) return;
    const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [open, active]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = ordered.length;
      if (!n) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : ordered.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const o = ordered[active];
      if (o) commit(o.value);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const cls = ['nte-picker', size === 'sm' ? 'sm' : '', open ? 'open' : '', className ?? ''].filter(Boolean).join(' ');
  const label = current?.label ?? placeholder ?? '';

  return (
    <div ref={rootRef} className={cls} onKeyDown={onKeyDown}>
      <button
        ref={btnRef}
        type="button"
        className="nte-pickerbtn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={title ?? label}
        onClick={() => (open ? close(false) : openMenu())}
      >
        <span className={`pk-label${current ? '' : ' placeholder'}`}>{label}</span>
        <Icon name="expand_more" size={size === 'sm' ? 15 : 17} />
      </button>
      {open && pos ? (
        <div
          ref={listRef}
          className="nte-pickerpop"
          role="listbox"
          aria-label={ariaLabel}
          style={{ left: pos.left, width: pos.width, maxHeight: pos.maxHeight, top: pos.top, bottom: pos.bottom }}
        >
          {groups.map((g) => (
            <div key={g.name ?? ' ungrouped'} className="pk-group">
              {g.name ? <div className="pk-grouphead">{g.name}</div> : null}
              {g.items.map((o) => {
                const idx = indexOf.get(o.value) ?? -1;
                const sel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    data-idx={idx}
                    role="option"
                    aria-selected={sel}
                    className={`pk-opt${sel ? ' sel' : ''}${idx === active ? ' active' : ''}`}
                    title={o.label}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => commit(o.value)}
                  >
                    <span className="pk-optlabel">{o.label}</span>
                    {sel ? <Icon name="check" size={14} style={{ marginLeft: 'auto' }} /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
