import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import type { EmbedButton } from '../../../shared/protocol';
import { EXAMPLE_IMAGES, resolveImage } from '../examples';
import { Check, ExternalLink, Hash, ImageOff, Trash } from '../icons';

/** A Discord channel window with one bot message; the preview goes in `children`. */
export function DiscordWindow({ children }: { children: ReactNode }) {
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="window">
      <div className="window-bar">
        <span className="channel">
          <Hash size={22} />
          general
        </span>
      </div>
      <div className="window-body">
        <div className="msg">
          <img className="msg-avatar" src={EXAMPLE_IMAGES.avatar} alt="" />
          <div className="msg-content">
            <div className="msg-head">
              <span className="msg-name">My Bot</span>
              <span className="app-badge">
                <Check size={10} />
                APP
              </span>
              <span className="msg-time">Today at {time}</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiscordButton({ button }: { button: Pick<EmbedButton, 'label' | 'style'> }) {
  return (
    <span className={`d-button style-${button.style.toLowerCase()}`}>
      <span className="d-button-label">{button.label}</span>
      {button.style === 'Link' && <ExternalLink size={14} />}
    </span>
  );
}

/** An image that shows a placeholder instead of a broken-image icon. */
export function Media({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !resolveImage(src)) {
    return (
      <span className="media media-fallback" role="img" aria-label="Image could not be loaded">
        <ImageOff size={16} />
      </span>
    );
  }
  return <img className="media" src={resolveImage(src)} alt="" onError={() => setFailed(true)} />;
}

type PartProps = {
  label: string;
  /** Leave out for parts with nothing to edit, like the timestamp. */
  onEdit?(): void;
  onRemove(): void;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'children'>;

/** One editable piece of the preview: click to edit it, the trash chip to remove it. */
export function Part({ label, onEdit, onRemove, children, className = '', ...rest }: PartProps) {
  return (
    <div
      {...rest}
      className={`part ${onEdit ? '' : 'static '}${className}`}
      role={onEdit ? 'button' : undefined}
      tabIndex={0}
      title={onEdit ? `Edit ${label}` : undefined}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (onEdit && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onEdit();
        } else if (event.key === 'Delete') {
          onRemove();
        }
      }}
    >
      {children}
      <button
        type="button"
        className="part-remove"
        aria-label={`Remove ${label}`}
        title={`Remove ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        <Trash size={12} />
      </button>
    </div>
  );
}
