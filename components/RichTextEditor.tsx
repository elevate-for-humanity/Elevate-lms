'use client';

/**
 * RichTextEditor
 * 
 * General-purpose rich text editor for admin content editing.
 * Uses TipTap for rich text editing with a toolbar interface.
 * 
 * Usage:
 *   <RichTextEditor value={content} onChange={setContent} placeholder="Enter content..." />
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Link,
  Image,
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onJsonChange?: (json: object) => void;
  placeholder?: string;
  maxChars?: number;
  editable?: boolean;
  className?: string;
}

const TOOLBAR_BUTTON =
  'p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

export function RichTextEditor({
  value,
  onChange,
  onJsonChange,
  placeholder = 'Start typing...',
  maxChars = 50_000,
  editable = true,
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxChars }),
    ],
    content: value || '',
    editable,
    onUpdate({ editor }) {
      if (onChange) {
        onChange(editor.getHTML());
      }
      if (onJsonChange) {
        onJsonChange(editor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none ' +
          'prose-headings:font-semibold prose-headings:text-slate-900 ' +
          'prose-p:text-slate-700 prose-li:text-slate-700 ' +
          'prose-blockquote:border-l-4 prose-blockquote:border-brand-blue-300 prose-blockquote:pl-4 prose-blockquote:text-slate-600',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && current !== value) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className={`rounded-lg border border-slate-200 overflow-hidden bg-white ${className}`}>
        <div className="h-64 bg-slate-50 animate-pulse" />
      </div>
    );
  }

  const chars = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className={`rounded-lg border border-slate-200 overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <button
            type="button"
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().toggleBold()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().toggleItalic()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().toggleStrike()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().toggleCode()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('code') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            title="Heading 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            title="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${TOOLBAR_BUTTON} ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''}`}
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={TOOLBAR_BUTTON}
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={TOOLBAR_BUTTON}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={TOOLBAR_BUTTON}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor canvas */}
      <EditorContent editor={editor} />

      {/* Footer — character count */}
      {editable && (
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-1">
          <span className={`text-xs ${chars > maxChars * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
            {chars.toLocaleString()} / {maxChars.toLocaleString()} chars
          </span>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;