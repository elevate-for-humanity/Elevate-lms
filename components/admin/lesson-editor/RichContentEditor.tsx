'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Minus, Undo, Redo } from 'lucide-react';

interface Props {
  value: object | null;
  onChange: (json: object) => void;
  placeholder?: string;
  maxChars?: number;
}

const TOOLBAR_BUTTON = 'p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

export default function RichContentEditor({ value, onChange, placeholder = 'Write lesson content…', maxChars = 50_000 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxChars }),
    ],
    content: value ?? undefined,
    onUpdate({ editor }) { onChange(editor.getJSON()); },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:border-brand-blue-300 prose-blockquote:pl-4 prose-blockquote:text-slate-600',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value ?? null);
    if (current !== incoming) editor.commands.setContent(value ?? null, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;
  const chars = editor.storage.characterCount?.characters() ?? 0;

  const buttons = [
    { title: 'Bold', active: editor.isActive('bold'), disabled: !editor.can().toggleBold(), icon: Bold, run: () => editor.chain().focus().toggleBold().run() },
    { title: 'Italic', active: editor.isActive('italic'), disabled: !editor.can().toggleItalic(), icon: Italic, run: () => editor.chain().focus().toggleItalic().run() },
    { title: 'Heading 2', active: editor.isActive('heading', { level: 2 }), icon: Heading2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', active: editor.isActive('heading', { level: 3 }), icon: Heading3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet list', active: editor.isActive('bulletList'), icon: List, run: () => editor.chain().focus().toggleBulletList().run() },
    { title: 'Numbered list', active: editor.isActive('orderedList'), icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { title: 'Blockquote', active: editor.isActive('blockquote'), icon: Quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Horizontal rule', active: false, icon: Minus, run: () => editor.chain().focus().setHorizontalRule().run() },
    { title: 'Undo', active: false, disabled: !editor.can().undo(), icon: Undo, run: () => editor.chain().focus().undo().run() },
    { title: 'Redo', active: false, disabled: !editor.can().redo(), icon: Redo, run: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {buttons.map(({ title, active, disabled, icon: Icon, run }) => (
          <button key={title} type="button" title={title} onClick={run} disabled={disabled} className={`${TOOLBAR_BUTTON} ${active ? 'bg-slate-200 text-slate-900' : ''}`}><Icon className="w-4 h-4" /></button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-1">
        <span className={`text-xs ${chars > maxChars * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>{chars.toLocaleString()} / {maxChars.toLocaleString()} chars</span>
      </div>
    </div>
  );
}
