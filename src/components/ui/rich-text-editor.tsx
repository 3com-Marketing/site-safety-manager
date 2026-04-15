import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Undo, Redo } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/** Wrap plain text (no HTML tags) in <p> for TipTap */
function ensureHtml(text: string): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
    ],
    content: ensureHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 text-sm',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = ensureHtml(value);
    if (current !== incoming && incoming !== '<p></p>') {
      editor.commands.setContent(incoming, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <Toggle
      size="sm"
      pressed={active}
      onPressedChange={() => onClick()}
      aria-label={title}
      className="h-8 w-8 p-0 data-[state=on]:bg-accent"
    >
      {children}
    </Toggle>
  );

  return (
    <div className={cn('rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1 bg-muted/30">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
          <Undo className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo className="h-4 w-4" />
        </ToolBtn>
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
      {!value && placeholder && (
        <style>{`.ProseMirror p.is-editor-empty:first-child::before { content: '${placeholder.replace(/'/g, "\\'")}'; color: hsl(var(--muted-foreground)); pointer-events: none; float: left; height: 0; }`}</style>
      )}
    </div>
  );
}
