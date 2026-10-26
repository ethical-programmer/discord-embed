import { useState } from 'react';
import type { V2Block, V2Gallery, V2Message, V2Section, V2Separator, V2Text } from '../../../shared/protocol';
import { V2_LIMITS } from '../codegenV2';
import { newId, v2Buttons } from '../defaults';
import { EXAMPLE_IMAGES, exampleRef, resolveImage, type ExampleName } from '../examples';
import { AlignLeft, ImageIcon, Plus, SeparatorIcon, Thumbnail, Trash } from '../icons';
import { isExampleRef } from '../limits';
import { ButtonFields, ButtonForm, EXAMPLE_LABELS, ImagePicker, buttonError, finishButton, imageError, takenIds } from './EditModal';
import { ErrorNote, MarkdownHint, Modal, TextInput } from './Modal';
import type { V2EditTarget } from './V2Preview';

interface Props {
  target: V2EditTarget;
  message: V2Message;
  onSave(block: V2Block): void;
  onClose(): void;
}

export function V2EditModal({ target, message, onSave, onClose }: Props) {
  const block = message.blocks.find((b) => b.id === (target.kind === 'block' ? target.id : target.blockId));
  if (!block) return null;
  const allButtons = v2Buttons(message);

  if (target.kind === 'button') {
    const button = block.type === 'buttons' ? block.buttons.find((b) => b.id === target.buttonId) : undefined;
    if (block.type !== 'buttons' || !button) return null;
    return (
      <ButtonForm
        button={button}
        takenIds={takenIds(allButtons, button.id)}
        onSave={(next) => onSave({ ...block, buttons: block.buttons.map((b) => (b.id === next.id ? next : b)) })}
        onClose={onClose}
      />
    );
  }

  switch (block.type) {
    case 'text':
      return <TextBlockForm block={block} onSave={onSave} onClose={onClose} />;
    case 'section':
      return <SectionForm block={block} taken={takenIds(allButtons, block.button.id)} onSave={onSave} onClose={onClose} />;
    case 'gallery':
      return <GalleryForm block={block} onSave={onSave} onClose={onClose} />;
    case 'separator':
      return <SeparatorForm block={block} onSave={onSave} onClose={onClose} />;
    case 'buttons':
      return null;
  }
}

interface FormProps<T> {
  block: T;
  onSave(block: V2Block): void;
  onClose(): void;
}

function TextBlockForm({ block, onSave, onClose }: FormProps<V2Text>) {
  const [content, setContent] = useState(block.content);
  const [error, setError] = useState('');
  const save = () => (content.trim() ? onSave({ ...block, content }) : setError('Write something, or remove this block with its trash button.'));

  return (
    <Modal title="Edit text" subtitle="A Text Display: markdown text anywhere in the message." icon={AlignLeft} onClose={onClose} onSubmit={save}>
      <TextInput label="Text" value={content} onChange={setContent} max={V2_LIMITS.text} multiline markdown autoFocus />
      <MarkdownHint />
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}

function SectionForm({ block, taken, onSave, onClose }: FormProps<V2Section> & { taken: string[] }) {
  const [texts, setTexts] = useState(block.texts);
  const [accessory, setAccessory] = useState(block.accessory);
  const [thumbnail, setThumbnail] = useState(block.thumbnail);
  const [button, setButton] = useState(block.button);
  const [error, setError] = useState('');

  const setText = (index: number, value: string) => setTexts(texts.map((t, i) => (i === index ? value : t)));

  const save = () => {
    const kept = texts.filter((t) => t.trim());
    if (!kept.length) return setError('A section needs some text.');
    const problem =
      accessory === 'thumbnail'
        ? thumbnail.trim()
          ? imageError(thumbnail)
          : 'Pick a thumbnail, or switch the accessory to a button.'
        : buttonError(button);
    if (problem) return setError(problem);
    onSave({ ...block, texts: kept, accessory, thumbnail: thumbnail.trim(), button: finishButton(button, taken) });
  };

  return (
    <Modal title="Edit section" subtitle="Up to three texts with a thumbnail or button beside them." icon={Thumbnail} onClose={onClose} onSubmit={save}>
      {texts.map((text, i) => (
        <div key={i} className="text-slot">
          <TextInput label={`Text ${i + 1}`} value={text} onChange={(value) => setText(i, value)} max={V2_LIMITS.text} multiline markdown autoFocus={i === 0} />
          {texts.length > 1 && (
            <button type="button" className="link-btn" onClick={() => setTexts(texts.filter((_, j) => j !== i))}>
              <Trash size={12} /> Remove text {i + 1}
            </button>
          )}
        </div>
      ))}
      {texts.length < V2_LIMITS.sectionTexts && (
        <button type="button" className="btn ghost add-row" onClick={() => setTexts([...texts, ''])}>
          <Plus size={14} /> Add text
        </button>
      )}
      <MarkdownHint />

      <div className="form-row">
        <span className="form-label">Beside the text</span>
        <div className="segmented tabs" role="radiogroup" aria-label="Accessory">
          {(['thumbnail', 'button'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              role="radio"
              className="seg-btn"
              aria-checked={accessory === kind}
              onClick={() => {
                setAccessory(kind);
                setError('');
              }}
            >
              {kind === 'thumbnail' ? 'Thumbnail' : 'Button'}
            </button>
          ))}
        </div>
      </div>
      {accessory === 'thumbnail' ? (
        <ImagePicker
          value={thumbnail}
          onChange={(value) => {
            setThumbnail(value);
            setError('');
          }}
          examples={['thumbnail', 'avatar', 'banner']}
          previewShape="thumbnail"
        />
      ) : (
        <ButtonFields value={button} onChange={setButton} />
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}

const GALLERY_EXAMPLES: ExampleName[] = ['banner', 'thumbnail', 'avatar'];

function GalleryForm({ block, onSave, onClose }: FormProps<V2Gallery>) {
  const [items, setItems] = useState(block.items);
  const [error, setError] = useState('');
  const full = items.length >= V2_LIMITS.galleryItems;

  const setUrl = (id: string, url: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, url } : item)));
    setError('');
  };
  const add = (url: string) => setItems([...items, { id: newId(), url }]);

  const save = () => {
    const index = items.findIndex((item) => !item.url.trim() || imageError(item.url));
    if (index >= 0) return setError(`Image ${index + 1} needs a full URL that starts with https://, or remove it.`);
    onSave({ ...block, items: items.map((item) => ({ ...item, url: item.url.trim() })) });
  };

  return (
    <Modal title="Edit media gallery" subtitle={`A grid of 1 to ${V2_LIMITS.galleryItems} images.`} icon={ImageIcon} onClose={onClose} onSubmit={save}>
      <div className="gallery-rows">
        {items.map((item, i) => {
          const example = isExampleRef(item.url) ? (item.url.slice('example:'.length) as ExampleName) : undefined;
          return (
            <div key={item.id} className="gallery-row">
              <span className="gallery-thumb">{resolveImage(item.url) && <img src={resolveImage(item.url)} alt="" />}</span>
              <input
                className="input mono"
                value={example ? '' : item.url}
                placeholder={example ? `Example: ${EXAMPLE_LABELS[example]} (preview only)` : 'https://cdn.example.com/image.png'}
                onChange={(e) => setUrl(item.id, e.target.value)}
                aria-label={`Image ${i + 1} URL`}
                autoFocus={i === 0}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                disabled={items.length === 1}
                aria-label={`Remove image ${i + 1}`}
                title="Remove image"
              >
                <Trash size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="gallery-add">
        <button type="button" className="btn ghost add-row" onClick={() => add('')} disabled={full}>
          <Plus size={14} /> Add image
        </button>
        <span className="hint">or an example:</span>
        {GALLERY_EXAMPLES.map((name) => (
          <button key={name} type="button" className="example-chip" onClick={() => add(exampleRef(name))} disabled={full} title={`Add ${EXAMPLE_LABELS[name]}`}>
            <img src={EXAMPLE_IMAGES[name]} alt="" />
            {EXAMPLE_LABELS[name]}
          </button>
        ))}
      </div>
      <p className="hint">Discord can only show images from a public URL, so examples are left out of the code.</p>
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}

function SeparatorForm({ block, onSave, onClose }: FormProps<V2Separator>) {
  const [divider, setDivider] = useState(block.divider);
  const [spacing, setSpacing] = useState(block.spacing);

  return (
    <Modal title="Edit separator" subtitle="Space between blocks, with or without a line." icon={SeparatorIcon} onClose={onClose} onSubmit={() => onSave({ ...block, divider, spacing })}>
      <label className="switch-row">
        <span>
          <strong>Show a line</strong>
          <small>Turn off for empty space only.</small>
        </span>
        <span className="switch">
          <input type="checkbox" checked={divider} onChange={(e) => setDivider(e.target.checked)} autoFocus />
          <span className="switch-track" />
        </span>
      </label>
      <div className="form-row">
        <span className="form-label">Spacing</span>
        <div className="segmented tabs" role="radiogroup" aria-label="Spacing">
          {(['small', 'large'] as const).map((value) => (
            <button key={value} type="button" role="radio" className="seg-btn" aria-checked={spacing === value} onClick={() => setSpacing(value)}>
              {value === 'small' ? 'Small' : 'Large'}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
