import { describe, expect, test } from "vitest";
import { RECEIPT_BARCODE_VALUE, receiptBarcodeBits } from "./receipt-barcode";
import { translate } from "./language";

describe("receipt requirements", () => {
  test("bill barcode encodes exactly thankyou in Code 128", () => {
    expect(RECEIPT_BARCODE_VALUE).toBe("thankyou");
    // Code 128 start B, eight characters, checksum, and stop pattern.
    expect(receiptBarcodeBits()).toBe("110100100001001111010010011000010100101100001100001010011000010010110110111101000111101010011110010111101010001100011101011");
  });
  test("Arabic selection changes app, settings, history and receipt labels", () => {
    expect(translate("ar", "Current Order")).toBe("الطلب الحالي");
    expect(translate("ar", "Language")).toBe("اللغة");
    expect(translate("ar", "Invoice History")).toBe("سجل الفواتير");
    expect(translate("ar", "TOTAL")).toBe("الإجمالي");
    expect(translate("en", "Current Order")).toBe("Current Order");
  });
});