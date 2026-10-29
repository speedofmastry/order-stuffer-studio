import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Item = {
  id: string;
  name: string;
  price: number;
};

export type CartLine = {
  item: Item;
  qty: number;
};

export type InvoiceLine = {
  item_name: string;
  unit_price: number;
  qty: number;
  line_total: number;
};

export type Invoice = {
  id: string;
  invoice_no: number;
  total: number;
  item_count: number;
  created_at: string;
  lines?: InvoiceLine[];
};

const SHOP_KEY = "receipt_app_shop_v1";

export type ShopInfo = {
  name: string;
  address: string;
  phone: string;
  footer: string;
};

const defaultShop: ShopInfo = {
  name: "My Shop",
  address: "",
  phone: "",
  footer: "Thank you!",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("items")
      .select("id, name, price")
      .order("created_at", { ascending: true });
    if (data) setItems(data.map((d) => ({ ...d, price: Number(d.price) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (name: string, price: number) => {
      const { data, error } = await supabase
        .from("items")
        .insert({ name: name.trim(), price })
        .select("id, name, price")
        .single();
      if (error) throw error;
      if (data)
        setItems((prev) => [...prev, { ...data, price: Number(data.price) }]);
    },
    [],
  );

  const update = useCallback(async (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("items").update(patch).eq("id", id);
    if (error) throw error;
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { items, loading, add, update, remove };
}

export async function saveInvoice(lines: CartLine[]): Promise<number> {
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert({ total, item_count: itemCount })
    .select("id, invoice_no")
    .single();
  if (invError || !invoice) throw invError ?? new Error("Failed to save invoice");

  const { error: linesError } = await supabase.from("invoice_items").insert(
    lines.map((l) => ({
      invoice_id: invoice.id,
      item_name: l.item.name,
      unit_price: l.item.price,
      qty: l.qty,
      line_total: l.item.price * l.qty,
    })),
  );
  if (linesError) throw linesError;

  return invoice.invoice_no;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_no, total, item_count, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) {
        setInvoices(
          data.map((d) => ({ ...d, total: Number(d.total) })),
        );
      }
      setLoading(false);
    })();
  }, []);

  return { invoices, loading };
}

export async function getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  const { data } = await supabase
    .from("invoice_items")
    .select("item_name, unit_price, qty, line_total")
    .eq("invoice_id", invoiceId)
    .order("id", { ascending: true });
  return (data ?? []).map((d) => ({
    ...d,
    unit_price: Number(d.unit_price),
    line_total: Number(d.line_total),
  }));
}

export function useShop() {
  const [shop, setShopState] = useState<ShopInfo>(defaultShop);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("shop_settings")
        .select("name, address, phone, footer")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        setShopState(data);
      } else {
        // First run: carry over details saved on this device by the old version.
        const local = read<ShopInfo | null>(SHOP_KEY, null);
        if (local) {
          const merged = { ...defaultShop, ...local };
          setShopState(merged);
          await supabase.from("shop_settings").upsert({ id: 1, ...merged });
        }
      }
      setLoading(false);
    })();
  }, []);

  const setShop = useCallback(async (next: ShopInfo) => {
    const { error } = await supabase
      .from("shop_settings")
      .upsert({ id: 1, ...next, updated_at: new Date().toISOString() });
    if (error) throw error;
    setShopState(next);
  }, []);

  return { shop, setShop, loading };
}
