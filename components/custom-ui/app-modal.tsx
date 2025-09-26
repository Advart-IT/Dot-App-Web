import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"; // Added larger sizes
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  showFooter?: boolean;
}

export function AppModal({
  open,
  onClose,
  title,
  size = "md",
  children,
  onConfirm,
  confirmText = "Confirm",
  showFooter = true,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="app-modal" data-size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="app-modal-content">{children}</div>
        {showFooter && onConfirm && (
          <DialogFooter className="app-modal-footer">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}