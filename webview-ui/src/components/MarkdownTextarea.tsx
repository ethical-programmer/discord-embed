import { useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';
import {
  Bold,
  Code,
  EyeOff,
  Heading,
  Italic,
  LinkIcon,
  ListIcon,
  QuoteIcon,
  Strikethrough,
  Underline,
  type Icon,
} from '../icons';
import { makeLink, toggleLinePrefix, toggleWrap, type Change } from '../markdownFormat';

type Format = (value: string, start: number, end: number) => Change;

interface Action {
  label: string;
  /** Ctrl/Cmd + this key runs the action. */
  key?: string;
  icon?: Icon;
  /** Shown instead of an icon. */
  text?: string;
  run: Format;
}

const wrap = (marker: string): Format => (v, s, e) => toggleWrap(v, s, e, marker);
const line = (prefix: string): Format => (v, s, e) => toggleLinePrefix(v, s, e, prefix);

const INLINE: Action[] = [
  { label: 'Bold', key: 'b', icon: Bold, run: wrap('**') },
  { label: 'Italic', key: 'i', icon: Italic, run: wrap('*') },
  { label: 'Underline', key: 'u', icon: Underline, run: wrap('__') },
  { label: 'Strikethrough', icon: Strikethrough, run: wrap('~~') },
  { label: 'Inline code', icon: Code, run: wrap('`') },
  { label: 'Spoiler', icon: EyeOff, run: wrap('||') },
  { label: 'Link', key: 'k', icon: LinkIcon, run: makeLink },
];

const LINES: Action[] = [
  { label: 'Heading', icon: Heading, run: line('## ') },
  { label: 'Small text', text: '-#', run: line('-# ') },
  { label: 'Quote', icon: QuoteIcon, run: line('> ') },
  { label: 'List', icon: ListIcon, run: line('- ') },
];

// Styles a hidden copy of the textarea needs to wrap text the same way.
const MIRRORED = [
  'boxSizing', 'width', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight',
  'fontStretch', 'fontSize', 'lineHeight', 'fontFamily', 'textTransform', 'textIndent', 'letterSpacing',
  'wordSpacing', 'tabSize',
] as const;

/** Where character `index` sits inside the textarea, measured with a hidden copy of it. */
function caretPosition(el: HTMLTextAreaElement, index: number) {
  const style = getComputedStyle(el);
  const mirror = document.createElement('div');
  for (const prop of MIRRORED) mirror.style[prop] = style[prop];
  Object.assign(mirror.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' });
  mirror.textContent = el.value.slice(0, index);
  const marker = document.createElement('span');
  marker.textContent = el.value.slice(index) || '.';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const position = { top: marker.offsetTop, left: marker.offsetLeft, height: parseFloat(style.lineHeight) || 20 };
  mirror.remove();
  return position;
}

const BAR_HEIGHT = 38;
const GAP = 8;

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onValue(value: string): void;
};

/** A textarea with a formatting toolbar that appears above selected text. */
export function MarkdownTextarea({ value, onValue, onKeyDown, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const place = () => {
    const el = ref.current;
    if (!el || document.activeElement !== el || el.selectionStart === el.selectionEnd) {
      setPosition(null);
      return;
    }
    const start = caretPosition(el, el.selectionStart);
    const end = caretPosition(el, el.selectionEnd);
    const half = (barRef.current?.offsetWidth ?? 400) / 2;
    const middle = start.top === end.top ? (start.left + end.left) / 2 : start.left;
    const left = Math.min(Math.max(middle, half), Math.max(half, el.offsetWidth - half));
    // Above the selection, or below it when there's no room above the textarea.
    const above = start.top - el.scrollTop - BAR_HEIGHT - GAP;
    const top = above >= -BAR_HEIGHT ? above : end.top - el.scrollTop + end.height + GAP;
    setPosition({ top, left });
  };

  const apply = (format: Format) => {
    const el = ref.current;
    if (!el) return;
    const change = format(el.value, el.selectionStart, el.selectionEnd);
    el.focus();
    el.setSelectionRange(change.from, change.to);
    // insertText keeps Ctrl+Z working and fires a normal input event.
    const inserted = change.insert
      ? document.execCommand('insertText', false, change.insert)
      : document.execCommand('delete');
    if (!inserted) onValue(el.value.slice(0, change.from) + change.insert + el.value.slice(change.to));
    requestAnimationFrame(() => {
      el.setSelectionRange(change.selectFrom, change.selectTo);
      place();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      const action = INLINE.find((a) => a.key === event.key.toLowerCase());
      if (action) {
        event.preventDefault();
        apply(action.run);
        return;
      }
    }
    onKeyDown?.(event);
  };

  const button = (action: Action) => {
    const ActionIcon = action.icon;
    const title = action.key ? `${action.label} (Ctrl+${action.key.toUpperCase()})` : action.label;
    return (
      <button key={action.label} type="button" className="fmt-btn" title={title} aria-label={action.label} onClick={() => apply(action.run)}>
        {ActionIcon ? <ActionIcon size={15} /> : <span className="fmt-text">{action.text}</span>}
      </button>
    );
  };

  return (
    <div className="md-editor">
      <textarea
        {...rest}
        ref={ref}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={place}
        onScroll={place}
        onBlur={() => setPosition(null)}
      />
      {position && (
        <div
          ref={barRef}
          className="fmt-bar"
          role="toolbar"
          aria-label="Format selected text"
          style={{ top: position.top, left: position.left }}
          // Keep focus (and the selection) in the textarea while clicking buttons.
          onMouseDown={(e) => e.preventDefault()}
        >
          {INLINE.map(button)}
          <span className="fmt-sep" aria-hidden="true" />
          {LINES.map(button)}
        </div>
      )}
    </div>
  );
}
