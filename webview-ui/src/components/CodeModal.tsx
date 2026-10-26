import { useEffect, useMemo, useState } from 'react';
import type { EditorMode, Embed, V2Message } from '../../../shared/protocol';
import { getWarnings, toBuilderCode, toMessageJson } from '../codegen';
import { getV2Warnings, toV2BuilderCode, toV2Json } from '../codegenV2';
import { tokenize } from '../highlight';
import { AlertTriangle, Check, CircleCheck, Code, Copy } from '../icons';
import { Modal } from './Modal';

type Format = 'builder' | 'json';

const FORMATS: { id: Format; label: string }[] = [
  { id: 'builder', label: 'discord.js' },
  { id: 'json', label: 'JSON payload' },
];

interface Block {
  title: string;
  hint?: string;
  file: string;
  code: string;
}

function blocksFor(format: Format, mode: EditorMode, embed: Embed, message: V2Message): Block[] {
  const v2 = mode === 'components';
  if (format === 'json') {
    return [
      {
        title: 'Message payload',
        hint: v2
          ? 'Send it with channel.send(), a webhook, or the REST API. flags: 32768 turns on Components V2.'
          : 'Send it with channel.send(), a webhook, or the REST API.',
        file: 'message.json',
        code: v2 ? toV2Json(message) : toMessageJson(embed),
      },
    ];
  }
  const { imports, body } = v2 ? toV2BuilderCode(message) : toBuilderCode(embed);
  return [
    {
      title: 'Add this at the top of your file',
      hint: v2
        ? 'Needs discord.js 14.19 or newer. Already importing from discord.js? Just add the names that are missing.'
        : 'Already importing from discord.js? Just add the names that are missing.',
      file: 'imports',
      code: imports,
    },
    {
      title: v2 ? 'Build and send the message' : 'Build and send the embed',
      hint: 'Put this where your bot replies, e.g. a slash-command handler.',
      file: v2 ? 'message.js' : 'embed.js',
      code: body,
    },
  ];
}

interface Props {
  mode: EditorMode;
  embed: Embed;
  message: V2Message;
  onCopy(code: string): void;
  onClose(): void;
}

export function CodeModal({ mode, embed, message, onCopy, onClose }: Props) {
  const [format, setFormat] = useState<Format>('builder');
  // Index of the block that was just copied, or 'all'.
  const [copied, setCopied] = useState<number | 'all' | null>(null);
  const blocks = useMemo(() => blocksFor(format, mode, embed, message), [format, mode, embed, message]);
  const warnings = useMemo(() => (mode === 'embed' ? getWarnings(embed) : getV2Warnings(message)), [mode, embed, message]);

  useEffect(() => {
    if (copied === null) return;
    const timer = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = (text: string, which: number | 'all') => {
    onCopy(text);
    setCopied(which);
  };

  return (
    <Modal
      title="Get code"
      subtitle="Paste it into your bot, or send the JSON with a webhook."
      icon={Code}
      wide
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn primary" onClick={() => copy(blocks.map((b) => b.code).join('\n\n'), 'all')} autoFocus>
            {copied === 'all' ? <Check size={15} /> : <Copy size={15} />}
            {copied === 'all' ? 'Copied' : blocks.length > 1 ? 'Copy all' : 'Copy code'}
          </button>
        </>
      }
    >
      <div className="segmented tabs" role="tablist">
        {FORMATS.map((f) => (
          <button key={f.id} type="button" role="tab" className="seg-btn" aria-selected={format === f.id} onClick={() => setFormat(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {warnings.length > 0 ? (
        <div className="callout warn">
          <AlertTriangle size={16} />
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="callout ok">
          <CircleCheck size={16} />
          <span>Looks good. Discord will accept this {mode === 'embed' ? 'embed' : 'message'}.</span>
        </div>
      )}

      {blocks.map((block, index) => (
        <section key={block.file} className="code-step">
          <header className="code-step-head">
            {blocks.length > 1 && <span className="step-num">{index + 1}</span>}
            <div>
              <h3>{block.title}</h3>
              {block.hint && <p>{block.hint}</p>}
            </div>
          </header>
          <div className="code-panel">
            <div className="code-bar">
              <span className="code-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>{block.file}</span>
              <button type="button" className="code-copy" onClick={() => copy(block.code, index)}>
                {copied === index ? <Check size={13} /> : <Copy size={13} />}
                {copied === index ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="code">
              <code>
                {block.code.split('\n').map((line, i) => (
                  <span className="code-line" key={i}>
                    {tokenize(line).map((t, j) =>
                      t.kind ? (
                        <span key={j} className={`tok-${t.kind}`}>
                          {t.text}
                        </span>
                      ) : (
                        t.text
                      )
                    )}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </section>
      ))}
    </Modal>
  );
}
