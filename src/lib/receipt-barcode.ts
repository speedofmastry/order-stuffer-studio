import JsBarcode from "jsbarcode";

export const RECEIPT_BARCODE_VALUE = "thankyou";

export function receiptBarcodeBits(): string {
  const target: { encodings?: Array<{ data: string }> } = {};
  JsBarcode(target, RECEIPT_BARCODE_VALUE, { format: "CODE128", displayValue: false });
  return target.encodings?.map((encoding) => encoding.data).join("") ?? "";
}