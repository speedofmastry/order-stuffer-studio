import { useEffect, useState } from "react";
import type { CartLine, ShopInfo } from "@/lib/receipt-store";

type Props = {
  shop: ShopInfo;
  lines: CartLine[];
  orderNo: number;
  createdAt?: Date;
};

function money(n: number) {
  return n.toFixed(2);
}

export function Receipt({ shop, lines, orderNo, createdAt }: Props) {
  const [dateStr, setDateStr] = useState({ date: "", time: "" });
  useEffect(() => {
    const d = createdAt ?? new Date();
    setDateStr({ date: d.toLocaleDateString(), time: d.toLocaleTimeString() });
  }, [createdAt]);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const divider = "--------------------------------";

  return (
    <div id="receipt-print" className="receipt-paper mx-auto">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{shop.name}</div>
        {shop.address && <div>{shop.address}</div>}
        {shop.phone && <div>Tel: {shop.phone}</div>}
      </div>
      <div style={{ marginTop: 6 }}>{divider}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Order #{orderNo}</span>
        <span>{dateStr.date}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Time</span>
        <span>{dateStr.time}</span>
      </div>
      <div>{divider}</div>
      <div style={{ display: "flex", fontWeight: 700 }}>
        <span style={{ flex: 1 }}>Item</span>
        <span style={{ width: 28, textAlign: "right" }}>Qty</span>
        <span style={{ width: 60, textAlign: "right" }}>Total</span>
      </div>
      <div>{divider}</div>
      {lines.map((l) => (
        <div key={l.item.id} style={{ marginBottom: 2 }}>
          <div style={{ display: "flex" }}>
            <span style={{ flex: 1, wordBreak: "break-word" }}>{l.item.name}</span>
            <span style={{ width: 28, textAlign: "right" }}>{l.qty}</span>
            <span style={{ width: 60, textAlign: "right" }}>
              {money(l.item.price * l.qty)}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#444" }}>
            @ {money(l.item.price)}
          </div>
        </div>
      ))}
      <div>{divider}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Items</span>
        <span>{itemCount}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 700,
          fontSize: 14,
          marginTop: 4,
        }}
      >
        <span>TOTAL</span>
        <span>{money(total)}</span>
      </div>
      <div>{divider}</div>
      {shop.footer && (
        <div style={{ textAlign: "center", marginTop: 6 }}>{shop.footer}</div>
      )}
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 10 }}>
        ............................
      </div>
    </div>
  );
}
