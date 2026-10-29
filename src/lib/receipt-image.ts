import { receiptBarcodeBits } from "./receipt-barcode";
import { translate, type Language } from "./language";
import type { CartLine, ShopInfo } from "./receipt-store";

// 80mm thermal printers print 72mm at 203dpi = 576 dots per line.
export const RECEIPT_WIDTH_PX = 576;
const PAD = 16;
const FONT_FAMILY = 'Arial, Tahoma, "Segoe UI", sans-serif';
const INK = "#000000";
const PAPER = "#ffffff";

export type ReceiptInput = {
  shop: ShopInfo;
  lines: CartLine[];
  orderNo: number;
  createdAt: Date;
  language: Language;
};

export function receiptTotals(lines: CartLine[]) {
  return {
    total: lines.reduce((s, l) => s + l.item.price * l.qty, 0),
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}

export function receiptLocale(language: Language) {
  // Gregorian calendar and Western digits so dates read the same on every printer.
  return language === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB";
}

export function receiptFileName(orderNo: number) {
  return `receipt-${orderNo}.png`;
}

function money(n: number) {
  return n.toFixed(2);
}

function draw(ctx: CanvasRenderingContext2D, input: ReceiptInput): number {
  const { shop, lines, orderNo, createdAt, language } = input;
  const t = (s: string) => translate(language, s);
  const rtl = language === "ar";
  const W = RECEIPT_WIDTH_PX;
  const startX = rtl ? W - PAD : PAD;
  const endX = rtl ? PAD : W - PAD;
  const towardStart = rtl ? 1 : -1;
  const alignStart: CanvasTextAlign = rtl ? "right" : "left";
  const alignEnd: CanvasTextAlign = rtl ? "left" : "right";
  const font = (size: number, bold = false) => `${bold ? "bold " : ""}${size}px ${FONT_FAMILY}`;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.textBaseline = "top";
  ctx.direction = rtl ? "rtl" : "ltr";

  let y = PAD;

  const wrap = (text: string, maxWidth: number, f: string): string[] => {
    ctx.font = f;
    const out: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const attempt = line ? `${line} ${word}` : word;
        if (ctx.measureText(attempt).width <= maxWidth) {
          line = attempt;
          continue;
        }
        if (line) out.push(line);
        // Break words that are wider than the column on their own.
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            out.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      }
      out.push(line);
    }
    return out;
  };

  const center = (text: string, size: number, bold = false) => {
    const f = font(size, bold);
    for (const l of wrap(text, W - PAD * 2, f)) {
      ctx.font = f;
      ctx.textAlign = "center";
      ctx.fillText(l, W / 2, y);
      y += Math.round(size * 1.35);
    }
  };

  const row = (label: string, value: string, size = 24, bold = false) => {
    ctx.font = font(size, bold);
    ctx.textAlign = alignStart;
    ctx.fillText(label, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(value, endX, y);
    y += Math.round(size * 1.4);
  };

  const divider = () => {
    y += 6;
    ctx.save();
    ctx.setLineDash([10, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.restore();
    y += 12;
  };

  // Header
  center(t(shop.name || "My Shop"), 36, true);
  if (shop.address) center(shop.address, 22);
  if (shop.phone) center(`${t("Tel")}: ${shop.phone}`, 22);
  divider();

  const locale = receiptLocale(language);
  row(`${t("Invoice")} #${orderNo}`, createdAt.toLocaleDateString(locale), 24, true);
  row(t("Time"), createdAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }));
  divider();

  // Item table: name | qty | total
  const totalCol = 130;
  const qtyX = endX + towardStart * (totalCol + 10);
  const nameMax = W - PAD * 2 - totalCol - 90;
  ctx.font = font(22, true);
  ctx.textAlign = alignStart;
  ctx.fillText(t("Item"), startX, y);
  ctx.textAlign = alignEnd;
  ctx.fillText(t("Qty"), qtyX, y);
  ctx.fillText(t("Total"), endX, y);
  y += 30;
  divider();

  for (const l of lines) {
    const nameLines = wrap(l.item.name, nameMax, font(24, true));
    nameLines.forEach((nl, i) => {
      ctx.font = font(24, true);
      ctx.textAlign = alignStart;
      ctx.fillText(nl, startX, y);
      if (i === 0) {
        ctx.font = font(24);
        ctx.textAlign = alignEnd;
        ctx.fillText(String(l.qty), qtyX, y);
        ctx.fillText(money(l.item.price * l.qty), endX, y);
      }
      y += 32;
    });
    ctx.font = font(19);
    ctx.textAlign = alignStart;
    ctx.fillText(`@ ${money(l.item.price)}`, startX, y);
    y += 30;
  }

  divider();
  const { total, itemCount } = receiptTotals(lines);
  row(t("Items"), String(itemCount));
  y += 4;
  row(t("TOTAL"), money(total), 34, true);
  divider();

  if (shop.footer) {
    y += 4;
    center(t(shop.footer), 24, true);
  }

  // "thankyou" Code 128 barcode, 3 dots per module, always left-to-right.
  y += 14;
  const bits = receiptBarcodeBits();
  const module = 3;
  const barHeight = 90;
  const x0 = Math.round((W - bits.length * module) / 2);
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === "1") ctx.fillRect(x0 + i * module, y, module, barHeight);
  }
  y += barHeight + PAD * 2;

  return y;
}

export async function renderReceiptPng(input: ReceiptInput): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("Receipts render in the browser only");
  await document.fonts?.ready;

  const scratch = document.createElement("canvas");
  scratch.width = RECEIPT_WIDTH_PX;
  scratch.height = 1200 + input.lines.length * 160;
  const sctx = scratch.getContext("2d");
  if (!sctx) throw new Error("Canvas not supported");
  const height = draw(sctx, input);

  const out = document.createElement("canvas");
  out.width = RECEIPT_WIDTH_PX;
  out.height = height;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");
  octx.drawImage(scratch, 0, 0);

  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/png"),
  );
}

export type ShareResult = "shared" | "cancelled" | "unavailable";

export async function shareReceipt(blob: Blob, fileName: string, title: string): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: "image/png" });
  if (typeof navigator === "undefined" || !navigator.canShare?.({ files: [file] })) {
    return "unavailable";
  }
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    return "unavailable";
  }
}

export function downloadReceipt(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
