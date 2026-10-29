import { receiptBarcodeBits } from "@/lib/receipt-barcode";

export function ReceiptBarcode() {
  const bits = receiptBarcodeBits();
  return (
    <svg className="receipt-barcode" viewBox={`0 0 ${bits.length + 24} 56`} role="img" aria-label="thankyou" direction="ltr">
      <title>thankyou</title>
      <rect width={bits.length + 24} height={56} className="barcode-background" />
      {Array.from(bits).map((bit, index) => bit === "1" ? <rect key={index} x={index + 12} y={4} width={1} height={48} className="barcode-bar" /> : null)}
    </svg>
  );
}