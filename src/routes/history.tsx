import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Printer, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Receipt } from "@/components/Receipt";
import {
  useInvoices,
  getInvoiceLines,
  useShop,
  type Invoice,
  type CartLine,
} from "@/lib/receipt-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Invoice History — Receipt POS" },
      {
        name: "description",
        content: "Browse and reprint past 80mm thermal receipts.",
      },
      { property: "og:title", content: "Invoice History — Receipt POS" },
      { property: "og:description", content: "Browse and reprint past 80mm thermal receipts." },
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
  const { invoices, loading } = useInvoices();
  const { shop } = useShop();
  const [reprint, setReprint] = useState<{
    invoice: Invoice;
    lines: CartLine[];
  } | null>(null);

  const handleReprint = async (invoice: Invoice) => {
    const lines = await getInvoiceLines(invoice.id);
    if (lines.length === 0) {
      toast.error("No line items found for this invoice.");
      return;
    }
    setReprint({
      invoice,
      lines: lines.map((l) => ({
        item: { id: l.item_name, name: l.item_name, price: l.unit_price },
        qty: l.qty,
      })),
    });
    // Let the hidden receipt render before opening the print dialog.
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                Invoice History
              </h1>
              <p className="text-xs text-muted-foreground">
                {invoices.length} receipts saved
              </p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to register
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading invoices…
          </p>
        ) : invoices.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No invoices yet. Print a receipt and it will appear here.
          </Card>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      Invoice #{inv.invoice_no}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleString()} ·{" "}
                      {inv.item_count} items
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{money(inv.total)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleReprint(inv)}
                    >
                      <Printer className="mr-1 h-4 w-4" /> Reprint
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Hidden printable receipt (only visible when printing) */}
      {reprint && (
        <div className="sr-only print:not-sr-only">
          <Receipt
            shop={shop}
            lines={reprint.lines}
            orderNo={reprint.invoice.invoice_no}
            createdAt={new Date(reprint.invoice.created_at)}
          />
        </div>
      )}
    </div>
  );
}
