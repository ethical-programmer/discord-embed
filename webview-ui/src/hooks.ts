import { useEffect, useState, type DragEvent, type RefObject } from 'react';
import { move } from './layout';

const isVsCodeLight = () =>
  document.body.classList.contains('vscode-light') || document.body.classList.contains('vscode-high-contrast-light');

/** Whether VS Code's current theme is light. VS Code keeps the body's class up to date. */
export function useVsCodeIsLight(): boolean {
  const [light, setLight] = useState(isVsCodeLight);
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(isVsCodeLight()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return light;
}

/** Closes a popover on a click outside `ref` or on Escape. */
export function useDismiss(ref: RefObject<HTMLElement>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close]);
}

/** Drag-to-reorder for one list. Returns the props to spread onto item `index`. */
export function useReorder<T>(items: T[], onChange: (items: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const end = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (index: number) => ({
    draggable: true,
    'data-dragging': dragIndex === index || undefined,
    'data-drag-over': (dragIndex !== null && overIndex === index && dragIndex !== index) || undefined,
    onDragStart: (event: DragEvent) => {
      // Lists can nest (buttons inside a V2 block), so only the innermost one handles a drag.
      event.stopPropagation();
      setDragIndex(index);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (event: DragEvent) => {
      if (dragIndex === null) return;
      event.preventDefault();
      setOverIndex(index);
    },
    onDrop: (event: DragEvent) => {
      if (dragIndex === null) return;
      event.preventDefault();
      event.stopPropagation();
      if (dragIndex !== index) onChange(move(items, dragIndex, index));
      end();
    },
    onDragEnd: end,
  });
}
