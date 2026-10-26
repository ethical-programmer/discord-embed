import { useId, useState } from 'react';
import type { ButtonStyle, Embed, EmbedButton, EmbedField } from '../../../shared/protocol';
import type { ImagePart, TextPart } from '../defaults';
import { EXAMPLE_IMAGES, exampleRef, resolveImage, type ExampleName } from '../examples';
import { AlignLeft, Check, CircleDot, CircleUser, Columns, Heading, ImageIcon, MousePointerClick, Thumbnail, Type, User, type Icon } from '../icons';
import { LIMITS, isExampleRef, isImageUrl, isLinkUrl } from '../limits';
import { ErrorNote, MarkdownHint, Modal, TextInput } from './Modal';
import { DiscordButton } from './parts';

export type EditTarget =
  | { kind: 'text'; key: TextPart }
  | { kind: 'image'; key: ImagePart }
  | { kind: 'field'; id: string }
  | { kind: 'button'; id: string };

interface Props {
  target: EditTarget;
  embed: Embed;
  onSave(patch: Partial<Embed>): void;
  onClose(): void;
}

export function EditModal({ target, embed, onSave, onClose }: Props) {
  switch (target.kind) {
    case 'text':
      return <TextForm part={target.key} embed={embed} onSave={onSave} onClose={onClose} />;
    case 'image':
      return <ImageForm part={target.key} embed={embed} onSave={onSave} onClose={onClose} />;
    case 'field': {
      const field = embed.fields.find((f) => f.id === target.id);
      return field ? <FieldForm field={field} embed={embed} onSave={onSave} onClose={onClose} /> : null;
    }
    case 'button': {
      const button = embed.buttons.find((b) => b.id === target.id);
      if (!button) return null;
      return (
        <ButtonForm
          button={button}
          takenIds={takenIds(embed.buttons, button.id)}
          onSave={(next) => onSave({ buttons: embed.buttons.map((b) => (b.id === next.id ? next : b)) })}
          onClose={onClose}
        />
      );
    }
  }
}

interface FormProps {
  embed: Embed;
  onSave(patch: Partial<Embed>): void;
  onClose(): void;
}

const TEXT_PARTS: Record<TextPart, { label: string; subtitle: string; icon: Icon; max: number; multiline?: boolean; markdown?: boolean }> = {
  title: { label: 'Title', subtitle: 'The bold heading at the top of the embed.', icon: Heading, max: LIMITS.title },
  description: { label: 'Description', subtitle: 'The main text of the embed.', icon: AlignLeft, max: LIMITS.description, multiline: true, markdown: true },
  authorName: { label: 'Author name', subtitle: 'Small text shown above the title.', icon: User, max: LIMITS.authorName },
  footerText: { label: 'Footer text', subtitle: 'Small text at the bottom of the embed.', icon: Type, max: LIMITS.footerText, multiline: true },
};

function TextForm({ part, embed, onSave, onClose }: FormProps & { part: TextPart }) {
  const config = TEXT_PARTS[part];
  const [value, setValue] = useState(embed[part] ?? '');
  // Saving an empty value removes the part, the same as its trash button.
  const save = () => onSave({ [part]: value.trim() ? value : undefined });

  return (
    <Modal title={`Edit ${config.label.toLowerCase()}`} subtitle={config.subtitle} icon={config.icon} onClose={onClose} onSubmit={save}>
      <TextInput label={config.label} value={value} onChange={setValue} max={config.max} multiline={config.multiline} markdown={config.markdown} autoFocus />
      {config.markdown ? (
        <MarkdownHint />
      ) : (
        config.multiline && (
          <p className="hint">
            Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save. Leave it empty to remove it.
          </p>
        )
      )}
    </Modal>
  );
}

const IMAGE_PARTS: Record<ImagePart, { label: string; subtitle: string; icon: Icon; examples: ExampleName[] }> = {
  image: { label: 'Large image', subtitle: 'Shown full width below the fields.', icon: ImageIcon, examples: ['banner', 'thumbnail', 'avatar'] },
  thumbnail: { label: 'Thumbnail', subtitle: 'The small square image in the top right.', icon: Thumbnail, examples: ['thumbnail', 'avatar', 'banner'] },
  authorIcon: { label: 'Author icon', subtitle: 'The round icon next to the author name.', icon: CircleUser, examples: ['avatar', 'thumbnail', 'banner'] },
  footerIcon: { label: 'Footer icon', subtitle: 'The round icon next to the footer text.', icon: CircleDot, examples: ['avatar', 'thumbnail', 'banner'] },
};

export const EXAMPLE_LABELS: Record<ExampleName, string> = { avatar: 'Logo', thumbnail: 'Sparkle', banner: 'Banner' };

/** Why an image value can't be saved, or null. Empty is allowed (callers decide what it means). */
export function imageError(value: string): string | null {
  const trimmed = value.trim();
  return trimmed && !isExampleRef(trimmed) && !isImageUrl(trimmed) ? 'Enter a full image URL that starts with https://' : null;
}

interface ImagePickerProps {
  /** A URL or an example reference; the URL box stays empty for examples. */
  value: string;
  onChange(value: string): void;
  examples: ExampleName[];
  /** Shapes the preview, e.g. "thumbnail" or "authorIcon". */
  previewShape: string;
  autoFocus?: boolean;
}

/** Image preview, URL box and example gallery. */
export function ImagePicker({ value, onChange, examples, previewShape, autoFocus }: ImagePickerProps) {
  const previewSrc = isExampleRef(value) || isImageUrl(value.trim()) ? resolveImage(value.trim()) : '';
  return (
    <>
      <div className="image-stage">
        {previewSrc ? <img src={previewSrc} alt="" className={`image-stage-img ${previewShape}`} /> : <span className="image-stage-empty">No image yet</span>}
      </div>
      <TextInput
        label="Image URL"
        value={isExampleRef(value) ? '' : value}
        onChange={onChange}
        placeholder="https://cdn.example.com/image.png"
        autoFocus={autoFocus}
        mono
      />
      <div className="form-row">
        <span className="form-label">Or use an example (preview only)</span>
        <div className="examples">
          {examples.map((name) => {
            const selected = value === exampleRef(name);
            return (
              <button key={name} type="button" className={`example example-${name}`} aria-pressed={selected} onClick={() => onChange(exampleRef(name))}>
                <img src={EXAMPLE_IMAGES[name]} alt="" />
                <span className="example-label">{EXAMPLE_LABELS[name]}</span>
                {selected && (
                  <span className="example-check">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="hint">Discord can only show images from a public URL, so examples are left out of the code.</p>
      </div>
    </>
  );
}

function ImageForm({ part, embed, onSave, onClose }: FormProps & { part: ImagePart }) {
  const config = IMAGE_PARTS[part];
  const [draft, setDraft] = useState(embed[part] ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const problem = imageError(draft);
    if (problem) return setError(problem);
    onSave({ [part]: draft.trim() || undefined });
  };

  return (
    <Modal title={`Edit ${config.label.toLowerCase()}`} subtitle={config.subtitle} icon={config.icon} onClose={onClose} onSubmit={save}>
      <ImagePicker
        value={draft}
        onChange={(value) => {
          setDraft(value);
          setError('');
        }}
        examples={config.examples}
        previewShape={part}
        autoFocus
      />
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}

function FieldForm({ field, embed, onSave, onClose }: FormProps & { field: EmbedField }) {
  const [name, setName] = useState(field.name);
  const [value, setValue] = useState(field.value);
  const [inline, setInline] = useState(field.inline);
  const [error, setError] = useState('');

  const save = () => {
    if (!name.trim() || !value.trim()) {
      setError('Discord needs both a name and a value for every field.');
      return;
    }
    onSave({ fields: embed.fields.map((f) => (f.id === field.id ? { ...f, name, value, inline } : f)) });
  };

  return (
    <Modal title="Edit field" subtitle="A titled block of text inside the embed." icon={Columns} onClose={onClose} onSubmit={save}>
      <TextInput label="Name" value={name} onChange={setName} max={LIMITS.fieldName} autoFocus />
      <TextInput label="Value" value={value} onChange={setValue} max={LIMITS.fieldValue} multiline markdown />
      <MarkdownHint />
      <label className="switch-row">
        <span>
          <strong>Inline</strong>
          <small>Sit next to other inline fields, up to three per row.</small>
        </span>
        <span className="switch">
          <input type="checkbox" checked={inline} onChange={(e) => setInline(e.target.checked)} />
          <span className="switch-track" />
        </span>
      </label>
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}

const BUTTON_STYLES: ButtonStyle[] = ['Primary', 'Secondary', 'Success', 'Danger', 'Link'];

/** Custom IDs used by the other (non-link) buttons, which this one must not reuse. */
export const takenIds = (buttons: EmbedButton[], exceptId: string) =>
  buttons.filter((b) => b.id !== exceptId && b.style !== 'Link').map((b) => b.customId);

/** Why a button can't be saved, or null. */
export function buttonError(button: EmbedButton): string | null {
  if (!button.label.trim()) return 'The button needs a label.';
  if (button.style === 'Link' && !isLinkUrl(button.url.trim())) return 'Link buttons need a full URL that starts with https://';
  return null;
}

/** "Get Roles!" → "get_roles": the custom ID a button gets from its label. */
export function labelToId(label: string): string {
  const slug = label
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (slug || 'button').slice(0, LIMITS.customId - 4);
}

/**
 * The button as saved: trimmed, with a custom ID made from its label.
 * Discord needs a unique custom ID on every non-link button, so the user never has to type one.
 */
export function finishButton(b: EmbedButton, taken: string[]): EmbedButton {
  const base = labelToId(b.label);
  let customId = base;
  for (let n = 2; taken.includes(customId); n++) customId = `${base}_${n}`;
  return { ...b, customId: b.style === 'Link' ? b.customId : customId, url: b.url.trim() };
}

/** Label, style picker, and custom ID or URL for one button. */
export function ButtonFields({ value, onChange, autoFocus }: { value: EmbedButton; onChange(value: EmbedButton): void; autoFocus?: boolean }) {
  const name = useId();
  const set = (patch: Partial<EmbedButton>) => onChange({ ...value, ...patch });
  return (
    <>
      <TextInput label="Label" value={value.label} onChange={(label) => set({ label })} max={LIMITS.buttonLabel} autoFocus={autoFocus} />
      <fieldset className="form-row style-fieldset">
        <legend className="form-label">Style</legend>
        <div className="style-grid">
          {BUTTON_STYLES.map((s) => (
            <label key={s} className="style-card">
              <input type="radio" name={name} checked={value.style === s} onChange={() => set({ style: s })} />
              <DiscordButton button={{ label: value.label.trim() || 'Button', style: s }} />
              <span className="style-name">{s}</span>
              <span className="style-check">
                <Check size={10} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {value.style === 'Link' ? (
        <TextInput label="URL" value={value.url} onChange={(url) => set({ url })} placeholder="https://example.com" mono />
      ) : (
        <p className="hint">
          When someone clicks it, your bot receives the ID <code>{labelToId(value.label)}</code> (made from the label).
        </p>
      )}
    </>
  );
}

interface ButtonFormProps {
  button: EmbedButton;
  takenIds: string[];
  onSave(button: EmbedButton): void;
  onClose(): void;
}

export function ButtonForm({ button, takenIds: taken, onSave, onClose }: ButtonFormProps) {
  const [draft, setDraft] = useState(button);
  const [error, setError] = useState('');

  const save = () => {
    const problem = buttonError(draft);
    if (problem) return setError(problem);
    onSave(finishButton(draft, taken));
  };

  return (
    <Modal title="Edit button" subtitle="Pick a label and style, or make it a link." icon={MousePointerClick} onClose={onClose} onSubmit={save}>
      <ButtonFields value={draft} onChange={setDraft} autoFocus />
      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}
