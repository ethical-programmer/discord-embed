import { useEffect, useState } from 'react';
import type { EditorMode, Embed, Prefs, SavedState, ToWebview, V2Block, V2Message } from '../../shared/protocol';
import { CodeModal } from './components/CodeModal';
import { EditModal, type EditTarget } from './components/EditModal';
import { EmbedPreview } from './components/EmbedPreview';
import { Toolbar, type AddablePart } from './components/Toolbar';
import { V2EditModal } from './components/V2EditModal';
import { V2Preview, type V2EditTarget } from './components/V2Preview';
import {
  PART_DEFAULTS,
  defaultEmbed,
  defaultMessage,
  isImagePart,
  newBlock,
  newButton,
  newId,
  restoreState,
  v2Buttons,
  type OptionalPart,
  type V2BlockKind,
} from './defaults';
import { useVsCodeIsLight } from './hooks';
import { post } from './vscode';

/** Waits for the saved state from the extension, then shows the editor. */
export function App() {
  const [initial, setInitial] = useState<SavedState>();

  useEffect(() => {
    const onMessage = (event: MessageEvent<ToWebview>) => {
      if (event.data.type === 'init') setInitial(restoreState(event.data.state));
    };
    window.addEventListener('message', onMessage);
    post({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return initial ? <Editor initial={initial} /> : null;
}

function Editor({ initial }: { initial: SavedState }) {
  const [mode, setMode] = useState<EditorMode>(initial.mode);
  const [embed, setEmbed] = useState<Embed>(initial.embed);
  const [message, setMessage] = useState<V2Message>(initial.message);
  const [prefs, setPrefs] = useState<Prefs>(initial.prefs);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [v2Editing, setV2Editing] = useState<V2EditTarget | null>(null);
  const [showCode, setShowCode] = useState(false);
  const vsCodeIsLight = useVsCodeIsLight();
  const light = prefs.theme === 'auto' ? vsCodeIsLight : prefs.theme === 'light';

  useEffect(() => {
    const timer = setTimeout(() => post({ type: 'save', state: { version: 2, mode, embed, message, prefs } }), 300);
    return () => clearTimeout(timer);
  }, [mode, embed, message, prefs]);

  const update = (patch: Partial<Embed>) => setEmbed((current) => ({ ...current, ...patch }));
  const updateMessage = (patch: Partial<V2Message>) => setMessage((current) => ({ ...current, ...patch }));
  const saveBlock = (block: V2Block) =>
    setMessage((current) => ({ ...current, blocks: current.blocks.map((b) => (b.id === block.id ? block : b)) }));

  function addPart(part: AddablePart) {
    if (part === 'field') {
      const field = { id: newId(), name: 'New Field', value: 'New field content goes here.', inline: false };
      update({ fields: [...embed.fields, field] });
      setEditing({ kind: 'field', id: field.id });
    } else if (part === 'button') {
      const button = newButton(embed.buttons);
      update({ buttons: [...embed.buttons, button] });
      setEditing({ kind: 'button', id: button.id });
    } else if (part === 'timestamp') {
      update({ timestamp: true });
    } else {
      update({ [part]: PART_DEFAULTS[part] });
      setEditing(isImagePart(part) ? { kind: 'image', key: part } : { kind: 'text', key: part });
    }
  }

  function removePart(part: OptionalPart) {
    update(part === 'timestamp' ? { timestamp: false } : { [part]: undefined });
  }

  function addBlock(kind: V2BlockKind) {
    const block = newBlock(kind, message);
    updateMessage({ blocks: [...message.blocks, block] });
    if (block.type === 'buttons') setV2Editing({ kind: 'button', blockId: block.id, buttonId: block.buttons[0].id });
    else if (block.type !== 'separator') setV2Editing({ kind: 'block', id: block.id });
  }

  function addRowButton(blockId: string) {
    const button = newButton(v2Buttons(message));
    updateMessage({
      blocks: message.blocks.map((b) => (b.id === blockId && b.type === 'buttons' ? { ...b, buttons: [...b.buttons, button] } : b)),
    });
    setV2Editing({ kind: 'button', blockId, buttonId: button.id });
  }

  return (
    <div className={`app ${light ? 'light' : 'dark'}`}>
      <Toolbar
        embed={embed}
        message={message}
        mode={mode}
        color={mode === 'embed' ? embed.color : message.accentColor}
        prefs={prefs}
        onMode={setMode}
        onAdd={addPart}
        onAddBlock={addBlock}
        onMessage={updateMessage}
        onColor={(color) => (mode === 'embed' ? update({ color }) : updateMessage({ accentColor: color }))}
        onPrefs={(patch) => setPrefs((current) => ({ ...current, ...patch }))}
        onShowCode={() => setShowCode(true)}
        onReset={() => (mode === 'embed' ? setEmbed(defaultEmbed()) : setMessage(defaultMessage()))}
      />
      <main className="stage">
        <div className="zoom" style={{ zoom: prefs.zoom }}>
          {mode === 'embed' ? (
            <EmbedPreview
              embed={embed}
              onEdit={setEditing}
              onRemove={removePart}
              onFieldsChange={(fields) => update({ fields })}
              onButtonsChange={(buttons) => update({ buttons })}
              onAddButton={() => addPart('button')}
            />
          ) : (
            <V2Preview
              message={message}
              onEdit={setV2Editing}
              onBlocksChange={(blocks) => updateMessage({ blocks })}
              onAddButton={addRowButton}
            />
          )}
          <p className="canvas-hint">
            <span>Click any part to edit it</span>
            <span aria-hidden="true">·</span>
            <span>Drag {mode === 'embed' ? 'fields and buttons' : 'blocks and buttons'} to reorder</span>
          </p>
        </div>
      </main>
      {editing && (
        <EditModal
          target={editing}
          embed={embed}
          onSave={(patch) => {
            update(patch);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {v2Editing && (
        <V2EditModal
          target={v2Editing}
          message={message}
          onSave={(block) => {
            saveBlock(block);
            setV2Editing(null);
          }}
          onClose={() => setV2Editing(null)}
        />
      )}
      {showCode && (
        <CodeModal
          mode={mode}
          embed={embed}
          message={message}
          onCopy={(text) => post({ type: 'copy', text })}
          onClose={() => setShowCode(false)}
        />
      )}
    </div>
  );
}
