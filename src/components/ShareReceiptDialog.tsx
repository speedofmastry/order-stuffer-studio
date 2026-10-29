import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/language";
import { downloadReceipt, shareReceipt } from "@/lib/receipt-image";

export type PreparedReceipt = { blob: Blob; fileName: string; title: string };

export function ShareReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: PreparedReceipt | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt) return;
    const u = URL.createObjectURL(receipt.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [receipt]);

  const onShare = async () => {
    if (!receipt) return;
    const result = await shareReceipt(receipt.blob, receipt.fileName, receipt.title);
    if (result === "shared") {
      toast.success(t("Receipt shared"));
      onClose();
    } else if (result === "unavailable") {
      toast.error(t("Sharing isn't available here. Save the image and open it in your printer app."));
    }
  };

  return (
    <Dialog open={!!receipt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("Receipt ready")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-auto rounded-md border border-border bg-muted p-2">
          {url && <img src={url} alt={receipt?.title ?? ""} className="receipt-preview" />}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => receipt && downloadReceipt(receipt.blob, receipt.fileName)}>
            <Download className="me-1 h-4 w-4" /> {t("Save image")}
          </Button>
          <Button onClick={() => void onShare()}>
            <Share2 className="me-1 h-4 w-4" /> {t("Share")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
