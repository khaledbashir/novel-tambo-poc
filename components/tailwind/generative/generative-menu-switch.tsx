import { EditorBubble, removeAIHighlight, useEditor } from "novel";
import { Fragment, type ReactNode, useEffect } from "react";
import { Button } from "../ui/button";
import Magic from "../ui/icons/magic";
import { AISelector } from "./ai-selector";

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();

  useEffect(() => {
    if (!open && editor) removeAIHighlight(editor);
  }, [open, editor]);
  const selectionEmpty = !!editor?.state.selection.empty;
  return (
    <>
      <EditorBubble
        tippyOptions={{
          placement: selectionEmpty ? "top" : "bottom-start",
          onHidden: () => {
            onOpenChange(false);
            if (editor) editor.chain().unsetHighlight().run();
          },
        }}
        className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl z-50">
        {!open && (
          <Fragment>
            <Button
              className="gap-1 rounded-none text-purple-500"
              variant="ghost"
              onClick={() => onOpenChange(true)}
              size="sm"
            >
              <Magic className="h-5 w-5" />
              Ask AI
            </Button>
            {children}
          </Fragment>
        )}
        {open && !selectionEmpty && <AISelector open={open} onOpenChange={onOpenChange} />}
      </EditorBubble>

      {/* When opened programmatically (e.g., via slash-command), the bubble may be hidden due to lack of selection.
          Render the AI selector overlay absolutely inside the editor container so it is visible even without a selection. */}
      {open && selectionEmpty && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <AISelector open={open} onOpenChange={onOpenChange} />
        </div>
      )}
    </>
  );
};

export default GenerativeMenuSwitch;
