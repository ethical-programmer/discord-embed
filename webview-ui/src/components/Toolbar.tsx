import { useEffect, useRef, useState } from 'react';
import type { EditorMode, Embed, Prefs, V2Message } from '../../../shared/protocol';
import logo from '../assets/logo.svg';
import { V2_LIMITS, countComponents } from '../codegenV2';
import type { OptionalPart, V2BlockKind } from '../defaults';
import { useDismiss } from '../hooks';
import {
  AlignLeft,
  Check,
  ChevronDown,
  CircleDot,
  CircleUser,
  Clock,
  Code,
  Columns,
  ContainerIcon,
  EmbedIcon,
  EyeOff,
  Heading,
  ImageIcon,
  Minus,
  Monitor,
  Moon,
  MousePointerClick,
  Plus,
  RotateCcw,
  SectionButton,
  SeparatorIcon,
  Sun,
  Thumbnail,
  Type,
  User,
  type Icon,
} from '../icons';
import { LIMITS } from '../limits';

export type AddablePart = OptionalPart | 'field' | 'button';

const ADD_GROUPS: { title: string; items: { part: AddablePart; label: string; icon: Icon }[] }[] = [
  {
    title: 'Header',
    items: [
      { part: 'authorIcon', label: 'Author icon', icon: CircleUser },
      { part: 'authorName', label: 'Author name', icon: User },
      { part: 'title', label: 'Title', icon: Heading },
      { part: 'description', label: 'Description', icon: AlignLeft },
    ],
  },
  {
    title: 'Content',
    items: [
      { part: 'field', label: 'Field', icon: Columns },
      { part: 'image', label: 'Large image', icon: ImageIcon },
      { part: 'thumbnail', label: 'Thumbnail', icon: Thumbnail },
    ],
  },
  {
    title: 'Footer',
    items: [
      { part: 'footerIcon', label: 'Footer icon', icon: CircleDot },
      { part: 'footerText', label: 'Footer text', icon: Type },
      { part: 'timestamp', label: 'Timestamp', icon: Clock },
    ],
  },
  {
    title: 'Components',
    items: [{ part: 'button', label: 'Button', icon: MousePointerClick }],
  },
];

const PRESET_COLORS = [
  { name: 'Blurple', value: '#5865F2' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Fuchsia', value: '#EB459E' },
  { name: 'Red', value: '#ED4245' },
  { name: 'Orange', value: '#F47B34' },
  { name: 'Yellow', value: '#FEE75C' },
  { name: 'Green', value: '#57F287' },
  { name: 'Teal', value: '#1ABC9C' },
  { name: 'Blue', value: '#3498DB' },
  { name: 'White', value: '#FFFFFF' },
];

const THEMES: { value: Prefs['theme']; label: string; icon: Icon }[] = [
  { value: 'auto', label: 'Match VS Code', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
}

interface Props {
  embed: Embed;
  message: V2Message;
  mode: EditorMode;
  /** The embed color or the container accent, depending on the mode. */
  color: string;
  prefs: Prefs;
  onMode(mode: EditorMode): void;
  onAdd(part: AddablePart): void;
  onAddBlock(kind: V2BlockKind): void;
  onMessage(patch: Partial<V2Message>): void;
  onColor(color: string): void;
  onPrefs(patch: Partial<Prefs>): void;
  onShowCode(): void;
  onReset(): void;
}

const MODES: { value: EditorMode; label: string; title: string; icon: Icon }[] = [
  { value: 'embed', label: 'Embed', title: 'Classic embed with buttons', icon: EmbedIcon },
  { value: 'components', label: 'Container V2', title: 'Components V2: containers, sections, galleries', icon: ContainerIcon },
];

export function Toolbar(props: Props) {
  const { embed, message, mode, color, prefs, onMode, onAdd, onAddBlock, onMessage, onColor, onPrefs, onShowCode, onReset } = props;
  const [confirmReset, setConfirmReset] = useState(false);

  // Reset asks for a second click, since the webview can't show confirm().
  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const zoomBy = (delta: number) => {
    const zoom = Math.round((prefs.zoom + delta) * 10) / 10;
    onPrefs({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) });
  };

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-logo" src={logo} alt="" />
        <span className="brand-name">Discord Embed</span>
        <span className="brand-tag">Studio</span>
      </div>

      <span className="topbar-divider" />

      <div className="segmented mode-switch" role="radiogroup" aria-label="What to design">
        {MODES.map(({ value, label, title, icon: ModeIcon }) => (
          <button key={value} type="button" role="radio" className="seg-btn" aria-checked={mode === value} title={title} onClick={() => onMode(value)}>
            <ModeIcon size={14} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'embed' ? (
        <AddMenu embed={embed} onAdd={onAdd} />
      ) : (
        <V2AddMenu message={message} onAddBlock={onAddBlock} onMessage={onMessage} />
      )}
      <ColorMenu color={color} onColor={onColor} label={mode === 'embed' ? 'Embed color' : 'Container accent'} />

      <div className="spacer" />

      <div className="segmented" role="group" aria-label="Zoom">
        <button type="button" className="seg-btn" onClick={() => zoomBy(-0.1)} disabled={prefs.zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out">
          <Minus size={14} />
        </button>
        <button type="button" className="seg-btn zoom-value" onClick={() => onPrefs({ zoom: 1 })} title="Reset zoom">
          {Math.round(prefs.zoom * 100)}%
        </button>
        <button type="button" className="seg-btn" onClick={() => zoomBy(0.1)} disabled={prefs.zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in">
          <Plus size={14} />
        </button>
      </div>

      <div className="segmented" role="radiogroup" aria-label="Preview theme">
        {THEMES.map(({ value, label, icon: ThemeIcon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            className="seg-btn"
            aria-checked={prefs.theme === value}
            aria-label={label}
            title={label}
            onClick={() => onPrefs({ theme: value })}
          >
            <ThemeIcon size={14} />
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`btn ${confirmReset ? 'danger' : 'ghost icon-only'}`}
        title={mode === 'embed' ? 'Reset to the example embed' : 'Reset to the example message'}
        aria-label={confirmReset ? 'Click again to reset' : 'Reset'}
        onClick={() => {
          if (confirmReset) {
            onReset();
            setConfirmReset(false);
          } else {
            setConfirmReset(true);
          }
        }}
      >
        <RotateCcw size={15} />
        {confirmReset && 'Click to confirm'}
      </button>

      <button type="button" className="btn primary" onClick={onShowCode}>
        <Code size={15} />
        Get Code
      </button>
    </header>
  );
}

function AddMenu({ embed, onAdd }: { embed: Embed; onAdd(part: AddablePart): void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const meta = (part: AddablePart): { disabled: boolean; text?: string } => {
    if (part === 'field') return { disabled: embed.fields.length >= LIMITS.fields, text: `${embed.fields.length}/${LIMITS.fields}` };
    if (part === 'button') return { disabled: embed.buttons.length >= LIMITS.buttons, text: `${embed.buttons.length}/${LIMITS.buttons}` };
    if (part === 'timestamp') return { disabled: embed.timestamp };
    return { disabled: embed[part] !== undefined };
  };

  return (
    <div className="popover-wrap" ref={ref}>
      <button type="button" className="btn ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Plus size={15} />
        Add
        <ChevronDown size={14} className="chevron" />
      </button>
      {open && (
        <div className="popover menu" role="menu">
          {ADD_GROUPS.map((group) => (
            <div key={group.title} className="menu-group" role="group" aria-label={group.title}>
              <div className="menu-title">{group.title}</div>
              {group.items.map(({ part, label, icon: ItemIcon }) => {
                const { disabled, text } = meta(part);
                const added = disabled && !text;
                return (
                  <button
                    key={part}
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    disabled={disabled}
                    onClick={() => {
                      onAdd(part);
                      setOpen(false);
                    }}
                  >
                    <span className="menu-icon">
                      <ItemIcon size={15} />
                    </span>
                    {label}
                    <span className="menu-meta">
                      {added ? (
                        <>
                          <Check size={12} /> Added
                        </>
                      ) : (
                        text
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const V2_ADD_GROUPS: { title: string; items: { kind: V2BlockKind; label: string; icon: Icon }[] }[] = [
  {
    title: 'Content',
    items: [
      { kind: 'text', label: 'Text', icon: AlignLeft },
      { kind: 'section-thumbnail', label: 'Section with thumbnail', icon: Thumbnail },
      { kind: 'section-button', label: 'Section with button', icon: SectionButton },
      { kind: 'gallery', label: 'Media gallery', icon: ImageIcon },
    ],
  },
  {
    title: 'Layout',
    items: [
      { kind: 'separator', label: 'Separator', icon: SeparatorIcon },
      { kind: 'buttons', label: 'Button row', icon: MousePointerClick },
    ],
  },
];

interface V2AddMenuProps {
  message: V2Message;
  onAddBlock(kind: V2BlockKind): void;
  onMessage(patch: Partial<V2Message>): void;
}

function V2AddMenu({ message, onAddBlock, onMessage }: V2AddMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const count = countComponents(message);

  const toggles = [
    { key: 'container', label: 'Wrap in container', icon: ContainerIcon, checked: message.container, disabled: false },
    { key: 'spoiler', label: 'Hide as spoiler', icon: EyeOff, checked: message.spoiler, disabled: !message.container },
  ] as const;

  return (
    <div className="popover-wrap" ref={ref}>
      <button type="button" className="btn ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Plus size={15} />
        Add
        <ChevronDown size={14} className="chevron" />
      </button>
      {open && (
        <div className="popover menu" role="menu">
          {V2_ADD_GROUPS.map((group) => (
            <div key={group.title} className="menu-group" role="group" aria-label={group.title}>
              <div className="menu-title">{group.title}</div>
              {group.items.map(({ kind, label, icon: ItemIcon }) => (
                <button
                  key={kind}
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    onAddBlock(kind);
                    setOpen(false);
                  }}
                >
                  <span className="menu-icon">
                    <ItemIcon size={15} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          ))}
          <div className="menu-group" role="group" aria-label="Container">
            <div className="menu-title">Container</div>
            {toggles.map(({ key, label, icon: ItemIcon, checked, disabled }) => (
              <button
                key={key}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                className="menu-item"
                disabled={disabled}
                onClick={() => onMessage({ [key]: !checked })}
              >
                <span className="menu-icon">
                  <ItemIcon size={15} />
                </span>
                {label}
                <span className={`mini-switch${checked ? ' on' : ''}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className={`menu-foot${count > V2_LIMITS.components ? ' over' : ''}`}>
            {count} / {V2_LIMITS.components} components used
          </div>
        </div>
      )}
    </div>
  );
}

function ColorMenu({ color, onColor, label }: { color: string; onColor(color: string): void; label: string }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(color);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  useEffect(() => setHex(color), [color]);

  const commitHex = () => {
    const value = hex.startsWith('#') ? hex : `#${hex}`;
    if (/^#[0-9a-f]{6}$/i.test(value)) onColor(value.toUpperCase());
    else setHex(color);
  };

  return (
    <div className="popover-wrap" ref={ref}>
      <button type="button" className="btn ghost color-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} title={label}>
        <span className="swatch-dot" style={{ background: color }} />
        <span className="mono">{color.toUpperCase()}</span>
        <ChevronDown size={14} className="chevron" />
      </button>
      {open && (
        <div className="popover color-popover" role="dialog" aria-label={label}>
          <div className="menu-title">{label}</div>
          <div className="swatches">
            {PRESET_COLORS.map((preset) => {
              const selected = preset.value.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  className="swatch"
                  style={{ background: preset.value, color: isLightColor(preset.value) ? '#111' : '#fff' }}
                  aria-pressed={selected}
                  aria-label={preset.name}
                  title={preset.name}
                  onClick={() => onColor(preset.value)}
                >
                  {selected && <Check size={14} />}
                </button>
              );
            })}
          </div>
          <div className="color-custom">
            <label className="color-native" title="Pick a custom color">
              <input type="color" value={color} onChange={(e) => onColor(e.target.value.toUpperCase())} aria-label="Custom color" />
            </label>
            <input
              className="input mono"
              value={hex}
              maxLength={7}
              onChange={(e) => setHex(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => e.key === 'Enter' && commitHex()}
              aria-label="Hex color"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
