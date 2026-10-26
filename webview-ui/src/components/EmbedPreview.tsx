import type { Embed, EmbedButton, EmbedField } from '../../../shared/protocol';
import type { OptionalPart } from '../defaults';
import { useReorder } from '../hooks';
import { Plus, Sparkles } from '../icons';
import { fieldSpans } from '../layout';
import { LIMITS } from '../limits';
import { Markdown } from '../markdown';
import type { EditTarget } from './EditModal';
import { DiscordButton, DiscordWindow, Media, Part } from './parts';

interface Props {
  embed: Embed;
  onEdit(target: EditTarget): void;
  onRemove(part: OptionalPart): void;
  onFieldsChange(fields: EmbedField[]): void;
  onButtonsChange(buttons: EmbedButton[]): void;
  onAddButton(): void;
}

/** The embed shown inside a Discord-style channel window. */
export function EmbedPreview({ embed, onEdit, onRemove, onFieldsChange, onButtonsChange, onAddButton }: Props) {
  const fieldDrag = useReorder(embed.fields, onFieldsChange);
  const buttonDrag = useReorder(embed.buttons, onButtonsChange);
  const spans = fieldSpans(embed.fields, embed.thumbnail !== undefined);
  const hasAuthor = embed.authorIcon !== undefined || embed.authorName !== undefined;
  const hasFooter = embed.footerIcon !== undefined || embed.footerText !== undefined || embed.timestamp;
  const isEmpty =
    !hasAuthor && !hasFooter && embed.title === undefined && embed.description === undefined &&
    embed.fields.length === 0 && embed.image === undefined && embed.thumbnail === undefined;
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <DiscordWindow>
      <article className="embed" style={{ borderLeftColor: embed.color }}>
        {isEmpty ? (
          <div className="embed-empty">
            <Sparkles size={18} />
            <div>
              <strong>This embed is empty</strong>
              <span>Use Add in the toolbar to start building it.</span>
            </div>
          </div>
        ) : (
          <>
            <div className="embed-body">
              <div className="embed-main">
                {hasAuthor && (
                  <div className="embed-author">
                    {embed.authorIcon !== undefined && (
                      <Part label="author icon" className="author-icon" onEdit={() => onEdit({ kind: 'image', key: 'authorIcon' })} onRemove={() => onRemove('authorIcon')}>
                        <Media src={embed.authorIcon} />
                      </Part>
                    )}
                    {embed.authorName !== undefined && (
                      <Part label="author name" onEdit={() => onEdit({ kind: 'text', key: 'authorName' })} onRemove={() => onRemove('authorName')}>
                        {embed.authorName}
                      </Part>
                    )}
                  </div>
                )}
                {embed.title !== undefined && (
                  <Part label="title" className="embed-title" onEdit={() => onEdit({ kind: 'text', key: 'title' })} onRemove={() => onRemove('title')}>
                    {embed.title}
                  </Part>
                )}
                {embed.description !== undefined && (
                  <Part label="description" className="embed-description" onEdit={() => onEdit({ kind: 'text', key: 'description' })} onRemove={() => onRemove('description')}>
                    <Markdown text={embed.description} />
                  </Part>
                )}
                {embed.fields.length > 0 && (
                  <div className="embed-fields">
                    {embed.fields.map((field, index) => (
                      <Part
                        key={field.id}
                        label={`field "${field.name}"`}
                        className="embed-field"
                        style={{ gridColumn: `span ${spans[index]}` }}
                        onEdit={() => onEdit({ kind: 'field', id: field.id })}
                        onRemove={() => onFieldsChange(embed.fields.filter((f) => f.id !== field.id))}
                        {...fieldDrag(index)}
                      >
                        <div className="field-name">{field.name}</div>
                        <div className="field-value">
                          <Markdown text={field.value} />
                        </div>
                      </Part>
                    ))}
                  </div>
                )}
              </div>
              {embed.thumbnail !== undefined && (
                <Part label="thumbnail" className="embed-thumbnail" onEdit={() => onEdit({ kind: 'image', key: 'thumbnail' })} onRemove={() => onRemove('thumbnail')}>
                  <Media src={embed.thumbnail} />
                </Part>
              )}
            </div>
            {embed.image !== undefined && (
              <Part label="image" className="embed-image" onEdit={() => onEdit({ kind: 'image', key: 'image' })} onRemove={() => onRemove('image')}>
                <Media src={embed.image} />
              </Part>
            )}
            {hasFooter && (
              <div className="embed-footer">
                {embed.footerIcon !== undefined && (
                  <Part label="footer icon" className="footer-icon" onEdit={() => onEdit({ kind: 'image', key: 'footerIcon' })} onRemove={() => onRemove('footerIcon')}>
                    <Media src={embed.footerIcon} />
                  </Part>
                )}
                {embed.footerText !== undefined && (
                  <Part label="footer text" onEdit={() => onEdit({ kind: 'text', key: 'footerText' })} onRemove={() => onRemove('footerText')}>
                    {embed.footerText}
                  </Part>
                )}
                {embed.footerText !== undefined && embed.timestamp && <span aria-hidden="true">•</span>}
                {embed.timestamp && (
                  <Part label="timestamp" onRemove={() => onRemove('timestamp')}>
                    Today at {time}
                  </Part>
                )}
              </div>
            )}
          </>
        )}
      </article>

      <div className="buttons">
        {embed.buttons.map((button, index) => (
          <Part
            key={button.id}
            label={`button "${button.label}"`}
            className="button-part"
            onEdit={() => onEdit({ kind: 'button', id: button.id })}
            onRemove={() => onButtonsChange(embed.buttons.filter((b) => b.id !== button.id))}
            {...buttonDrag(index)}
          >
            <DiscordButton button={button} />
          </Part>
        ))}
        {embed.buttons.length < LIMITS.buttons && (
          <button type="button" className="add-button" onClick={onAddButton} title="Add button" aria-label="Add button">
            <Plus size={16} />
          </button>
        )}
      </div>
    </DiscordWindow>
  );
}
