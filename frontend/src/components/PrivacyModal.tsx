import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>
              Simplelink's data collection and usage policies
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <p>Simplelink shortens URLs and tracks only two pieces of information: the time each link is clicked and the source of the link through a ?source= query tag. We do not collect any personal information such as IP addresses or any other data.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  