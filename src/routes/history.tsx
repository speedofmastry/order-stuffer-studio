import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Share2, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ShareReceiptDialog, type PreparedReceipt } from "@/components/ShareReceiptDialog";
import { useLanguage } from "@/lib/language";
import { renderReceiptPng, receiptFileName, receiptLocale, shareReceipt } from "@/lib/receipt-image";
import { useInvoices, getInvoiceLines, useShop, type Invoice } from "@/lib/receipt-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Invoice History — Receipt POS" },
      { name: "description", content: "Browse past invoices and share their 80mm receipts again." },
      { property: "og:title", content: "Invoice History — Receipt POS" },
      { property: "og:description", content: "Browse past invoices and share their 80mm receipts again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function money(n: number) {
  return n.toFixed(2);
}

function HistoryPage() {
  const { t, language } = useLanguage();
  const { invoices, loading } = useInvoices();
  const { shop } = useShop();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedReceipt | null>(null);

  const handleShare = async (invoice: Invoice) => {
    if (busyId) return;
    setBusyId(invoice.id);
    try {
      const lines = await getInvoiceLines(invoice.id);
      if (lines.length === 0) {
        toast.error(t("No line items found for this invoice."));
        return;
      }
      const blob = await renderReceiptPng({
        shop,
        lines: lines.map((l, i) => ({
          item: { id: `${i}`, name: l.item_name, price: l.unit_price },
          qty: l.qty,
        })),
        orderNo: invoice.invoice_no,
        createdAt: new Date(invoice.created_at),
        language,
      });
      const receipt = {
        blob,
        fileName: receiptFileName(invoice.invoice_no),
        title: `${t("Invoice")} #${invoice.invoice_no}`,
      };
      const result = await shareReceipt(receipt.blob, receipt.fileName, receipt.title);
      if (result === "shared") toast.success(t("Receipt shared"));
      else setPrepared(receipt);
    } catch {
      toast.error(t("Could not load the invoice."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight">{t("Invoice History")}</h1>
              <p className="text-xs text-muted-foreground">
                {invoices.length} {t("receipts saved")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <LanguageToggle />
            <Link to="/">
              <Button variant="outline" size="sm" aria-label={t("Back to register")}>
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="ms-1 hidden sm:inline">{t("Back to register")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("Loading invoices…")}</p>
        ) : invoices.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            {t("No invoices yet. Share a receipt and it will appear here.")}
          </Card>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {t("Invoice")} #{inv.invoice_no}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleString(receiptLocale(language))} · {inv.item_count}{" "}
                      {t("items")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{money(inv.total)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === inv.id}
                      onClick={() => void handleShare(inv)}
                    >
                      <Share2 className="me-1 h-4 w-4" /> {t("Share")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ShareReceiptDialog receipt={prepared} onClose={() => setPrepared(null)} />
    </div>
  );
}
