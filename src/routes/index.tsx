import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Printer, Settings, Receipt as ReceiptIcon, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Receipt } from "@/components/Receipt";
import { Link } from "@tanstack/react-router";
import { useItems, useShop, saveInvoice, type CartLine, type Item } from "@/lib/receipt-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipt POS — 80mm Thermal Printer" },
      { name: "description", content: "Manage items, build orders, and print 80mm thermal receipts." },
      { property: "og:title", content: "Receipt POS — 80mm Thermal Printer" },
      { property: "og:description", content: "Manage items, build orders, and print 80mm thermal receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function money(n: number) {
  return n.toFixed(2);
}

function Index() {
  const { items, add, update, remove } = useItems();
  const { shop, setShop } = useShop();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNo, setOrderNo] = useState(1);

  const lines: CartLine[] = useMemo(
    () =>
      items
        .filter((i) => cart[i.id] > 0)
        .map((i) => ({ item: i, qty: cart[i.id] })),
    [items, cart],
  );

  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);

  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setCart((c) => {
      const next = (c[id] ?? 0) - 1;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  const setQty = (id: string, q: number) =>
    setCart((c) => {
      const copy = { ...c };
      if (q <= 0) delete copy[id];
      else copy[id] = q;
      return copy;
    });

  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    if (lines.length === 0) {
      toast.error("Add at least one item to the order.");
      return;
    }
    if (printing) return;
    setPrinting(true);
    try {
      const invoiceNo = await saveInvoice(lines);
      setOrderNo(invoiceNo);
      // Let the receipt re-render with the real invoice number before printing.
      setTimeout(() => {
        window.print();
        setCart({});
        setPrinting(false);
        toast.success(`Invoice #${invoiceNo} saved and sent to printer`);
      }, 100);
    } catch {
      setPrinting(false);
      toast.error("Could not save the invoice. Check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{shop.name || "Receipt POS"}</h1>
              <p className="text-xs text-muted-foreground">80mm thermal printer ready</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/history">
              <Button variant="outline" size="sm">
                <History className="mr-1 h-4 w-4" /> History
              </Button>
            </Link>
            <ManageItemsDialog
              items={items}
              onAdd={add}
              onUpdate={update}
              onRemove={remove}
            />
            <ShopSettingsDialog shop={shop} setShop={setShop} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1fr_360px]">
        {/* Items grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tap to add
            </h2>
            <span className="text-xs text-muted-foreground">{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No items yet. Add your first product to start taking orders.
              </p>
              <ManageItemsDialog
                items={items}
                onAdd={add}
                onUpdate={update}
                onRemove={remove}
                triggerLabel="Add your first item"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((it) => {
                const qty = cart[it.id] ?? 0;
                return (
                  <button
                    key={it.id}
                    onClick={() => inc(it.id)}
                    className="group relative flex flex-col items-start justify-between rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="line-clamp-2 text-sm font-medium">{it.name}</div>
                    <div className="mt-2 flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {money(it.price)}
                      </span>
                      {qty > 0 && (
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                          {qty}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Cart / order */}
        <aside className="lg:sticky lg:top-[68px] lg:h-[calc(100vh-84px)]">
          <Card className="flex h-full flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Current Order</div>
                <div className="text-xs text-muted-foreground">Order #{orderNo}</div>
              </div>
              {lines.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart({})}
                  className="text-muted-foreground"
                >
                  <X className="mr-1 h-4 w-4" /> Clear
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto px-2 py-2">
              {lines.length === 0 ? (
                <div className="grid h-full place-items-center px-4 text-center text-sm text-muted-foreground">
                  Tap items on the left to add them to the order.
                </div>
              ) : (
                <ul className="space-y-1">
                  {lines.map((l) => (
                    <li
                      key={l.item.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{l.item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {money(l.item.price)} × {l.qty} = {money(l.item.price * l.qty)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => dec(l.item.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={l.qty}
                          onChange={(e) => setQty(l.item.id, parseInt(e.target.value || "0", 10))}
                          className="h-7 w-12 text-center"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => inc(l.item.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border bg-muted/40 p-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Items</span>
                <span>{totalQty}</span>
              </div>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-2xl font-bold tracking-tight">{money(total)}</span>
              </div>
              <Button onClick={() => void handlePrint()} disabled={printing} className="w-full" size="lg">
                <Printer className="mr-2 h-4 w-4" />
                Print 80mm Receipt
              </Button>
            </div>
          </Card>
        </aside>
      </main>

      {/* Hidden printable receipt (only visible when printing) */}
      <div className="sr-only print:not-sr-only">
        <Receipt shop={shop} lines={lines} orderNo={orderNo} />
      </div>
    </div>
  );
}

function ManageItemsDialog({
  items,
  onAdd,
  onUpdate,
  onRemove,
  triggerLabel,
}: {
  items: Item[];
  onAdd: (name: string, price: number) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Item>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  triggerLabel?: string;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const submit = async () => {
    const p = parseFloat(price);
    if (!name.trim() || isNaN(p) || p < 0) {
      toast.error("Enter a valid name and price.");
      return;
    }
    try {
      await onAdd(name, p);
      setName("");
      setPrice("");
      toast.success("Item added");
    } catch {
      toast.error("Could not save the item. Check your connection.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerLabel ? "default" : "outline"} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {triggerLabel ?? "Items"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Items</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_110px_auto] gap-2">
          <Input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button onClick={submit}>Add</Button>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-border">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No items yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="grid grid-cols-[1fr_110px_auto] items-center gap-2 p-2">
                  <Input
                    value={it.name}
                    onChange={(e) => onUpdate(it.id, { name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={it.price}
                    onChange={(e) =>
                      onUpdate(it.id, { price: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(it.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShopSettingsDialog({
  shop,
  setShop,
}: {
  shop: ReturnType<typeof useShop>["shop"];
  setShop: ReturnType<typeof useShop>["setShop"];
}) {
  const [draft, setDraft] = useState(shop);

  return (
    <Dialog onOpenChange={(o) => o && setDraft(shop)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shop / Receipt Header</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Shop name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Footer message</Label>
            <Input
              value={draft.footer}
              onChange={(e) => setDraft({ ...draft, footer: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setShop(draft);
              toast.success("Settings saved");
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
