import { useEffect, useId, type KeyboardEvent, type ReactNode } from 'react';
import { X, type Icon } from '../icons';
import { MarkdownTextarea } from './MarkdownTextarea';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  onClose(): void;
  /** When set, the modal is a form with Cancel/Save; Enter in a text input saves. */
  onSubmit?(): void;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}

export function Modal({ title, subtitle, icon: HeaderIcon, onClose, onSubmit, actions, wide, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form
        className={`modal${wide ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <header className="modal-head">
          {HeaderIcon && (
            <span className="modal-icon">
              <HeaderIcon size={18} />
            </span>
          )}
          <div className="modal-titles">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn ghost modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-foot">
          {actions ?? (
            <>
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Save changes
              </button>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange(value: string): void;
  max?: number;
  multiline?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  mono?: boolean;
  /** Discord renders it as markdown: show the formatting toolbar on selection. Needs `multiline`. */
  markdown?: boolean;
}

export function TextInput({ label, value, onChange, max, multiline, autoFocus, placeholder, mono, markdown }: TextInputProps) {
  const id = useId();
  const common = {
    id,
    value,
    maxLength: max,
    autoFocus,
    placeholder,
    spellCheck: multiline,
    className: `input${mono ? ' mono' : ''}`,
  };
  const handleChange = (event: { target: { value: string } }) => onChange(event.target.value);

  // Ctrl/Cmd+Enter saves from a textarea, where plain Enter adds a new line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="form-row">
      <label htmlFor={id} className="form-label">
        <span>{label}</span>
        {max !== undefined && (
          <span className={`counter${value.length > max * 0.9 ? ' near' : ''}`}>
            {value.length.toLocaleString()} / {max.toLocaleString()}
          </span>
        )}
      </label>
      {multiline && markdown ? (
        <MarkdownTextarea {...common} onValue={onChange} rows={4} onKeyDown={onKeyDown} />
      ) : multiline ? (
        <textarea {...common} onChange={handleChange} rows={4} onKeyDown={onKeyDown} />
      ) : (
        <input {...common} onChange={handleChange} type="text" />
      )}
    </div>
  );
}

/** Under text boxes whose content Discord renders as markdown. */
export function MarkdownHint() {
  return (
    <p className="hint">
      Select text to format it, or use <kbd>Ctrl</kbd> + <kbd>B</kbd> / <kbd>I</kbd> / <kbd>U</kbd> / <kbd>K</kbd>. Markdown like{' '}
      <code># Heading</code> and <code>-# small text</code> works too. Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save.
    </p>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="error" role="alert">
      {children}
    </p>
  );
}
