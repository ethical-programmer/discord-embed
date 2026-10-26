import type { V2Block, V2Buttons, V2Message } from '../../../shared/protocol';
import { V2_LIMITS } from '../codegenV2';
import { useReorder } from '../hooks';
import { Plus, Sparkles } from '../icons';
import { Markdown } from '../markdown';
import { DiscordButton, DiscordWindow, Media, Part } from './parts';

export type V2EditTarget = { kind: 'block'; id: string } | { kind: 'button'; blockId: string; buttonId: string };

interface Props {
  message: V2Message;
  onEdit(target: V2EditTarget): void;
  onBlocksChange(blocks: V2Block[]): void;
  onAddButton(blockId: string): void;
}

/** A Components V2 message, optionally wrapped in a Container. */
export function V2Preview({ message, onEdit, onBlocksChange, onAddButton }: Props) {
  const drag = useReorder(message.blocks, onBlocksChange);
  const remove = (id: string) => onBlocksChange(message.blocks.filter((b) => b.id !== id));
  // A button row with no buttons left is removed with its last button.
  const replace = (block: V2Block) =>
    block.type === 'buttons' && block.buttons.length === 0
      ? remove(block.id)
      : onBlocksChange(message.blocks.map((b) => (b.id === block.id ? block : b)));

  const blocks = message.blocks.map((block, index) => {
    const edit = () => onEdit({ kind: 'block', id: block.id });
    const props = { onRemove: () => remove(block.id), ...drag(index) };

    switch (block.type) {
      case 'text':
        return (
          <Part key={block.id} label="text" className="v2-block" onEdit={edit} {...props}>
            <Markdown text={block.content} />
          </Part>
        );
      case 'section':
        return (
          <Part key={block.id} label="section" className="v2-block v2-section" onEdit={edit} {...props}>
            <div className="v2-section-texts">
              {block.texts.map((text, i) => (
                <Markdown key={i} text={text} />
              ))}
            </div>
            {block.accessory === 'thumbnail' ? (
              <div className="v2-thumb">
                <Media src={block.thumbnail} />
              </div>
            ) : (
              <div className="v2-accessory">
                <DiscordButton button={block.button} />
              </div>
            )}
          </Part>
        );
      case 'gallery':
        return (
          <Part key={block.id} label="media gallery" className="v2-block" onEdit={edit} {...props}>
            <div className={`v2-gallery n${Math.min(block.items.length, 5)}`}>
              {block.items.map((item) => (
                <Media key={item.id} src={item.url} />
              ))}
            </div>
          </Part>
        );
      case 'separator':
        return (
          <Part key={block.id} label="separator" className={`v2-block v2-sep ${block.spacing}`} onEdit={edit} {...props}>
            {block.divider ? <hr /> : <span className="v2-sep-space" />}
          </Part>
        );
      case 'buttons':
        return (
          <Part key={block.id} label="button row" className="v2-block quiet" {...props}>
            <ButtonRow block={block} onEdit={onEdit} onChange={replace} onAddButton={onAddButton} />
          </Part>
        );
    }
  });

  const content =
    blocks.length > 0 ? (
      blocks
    ) : (
      <div className="embed-empty">
        <Sparkles size={18} />
        <div>
          <strong>This message is empty</strong>
          <span>Use Add in the toolbar to add text, sections, images or buttons.</span>
        </div>
      </div>
    );

  return (
    <DiscordWindow>
      {message.container ? (
        <div className="v2-container" style={{ borderLeftColor: message.accentColor }}>
          {message.spoiler && <span className="v2-spoiler-tag">Spoiler</span>}
          {content}
        </div>
      ) : (
        <div className="v2-stack">{content}</div>
      )}
    </DiscordWindow>
  );
}

interface ButtonRowProps {
  block: V2Buttons;
  onEdit(target: V2EditTarget): void;
  onChange(block: V2Buttons): void;
  onAddButton(blockId: string): void;
}

function ButtonRow({ block, onEdit, onChange, onAddButton }: ButtonRowProps) {
  const drag = useReorder(block.buttons, (buttons) => onChange({ ...block, buttons }));
  return (
    <div className="buttons">
      {block.buttons.map((button, index) => (
        <Part
          key={button.id}
          label={`button "${button.label}"`}
          className="button-part"
          onEdit={() => onEdit({ kind: 'button', blockId: block.id, buttonId: button.id })}
          onRemove={() => onChange({ ...block, buttons: block.buttons.filter((b) => b.id !== button.id) })}
          {...drag(index)}
        >
          <DiscordButton button={button} />
        </Part>
      ))}
      {block.buttons.length < V2_LIMITS.rowButtons && (
        <button
          type="button"
          className="add-button"
          onClick={(event) => {
            event.stopPropagation();
            onAddButton(block.id);
          }}
          title="Add button"
          aria-label="Add button"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
