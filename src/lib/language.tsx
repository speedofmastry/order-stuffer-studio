import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "ar";
export const LANGUAGE_KEY = "receipt_app_language_v1";
export const arabic: Record<string, string> = {
  "Receipt POS": "نظام الفواتير",
  "My Shop": "متجري",
  "Thank you!": "شكراً لك!",
  "80mm thermal printer ready": "طابعة حرارية ٨٠ مم",
  "History": "السجل",
  "Items": "الأصناف",
  "Tap to add": "الأصناف",
  "items": "أصناف",
  "No items yet. Add your first product to start taking orders.": "لا توجد أصناف بعد. أضف أول منتج لبدء تسجيل الطلبات.",
  "Add your first item": "إضافة أول صنف",
  "Current Order": "الطلب الحالي",
  "Order": "الطلب",
  "Clear": "مسح",
  "Tap items on the left to add them to the order.": "اختر الأصناف لإضافتها إلى الطلب.",
  "Total": "الإجمالي",
  "TOTAL": "الإجمالي",
  "Print 80mm Receipt": "طباعة فاتورة ٨٠ مم",
  "Add at least one item to the order.": "أضف صنفاً واحداً على الأقل إلى الطلب.",
  "Could not save the invoice. Check your connection.": "تعذر حفظ الفاتورة. تحقق من اتصالك.",
  "Invoice saved; print dialog opened": "تم حفظ الفاتورة وفتح نافذة الطباعة",
  "Manage Items": "إدارة الأصناف",
  "Item name": "اسم الصنف",
  "Price": "السعر",
  "Add": "إضافة",
  "No items yet.": "لا توجد أصناف بعد.",
  "Enter a valid name and price.": "أدخل اسماً وسعراً صحيحين.",
  "Item added": "تمت إضافة الصنف",
  "Could not save the item. Check your connection.": "تعذر حفظ الصنف. تحقق من اتصالك.",
  "Shop / Receipt Header": "إعدادات المتجر والفاتورة",
  "Shop name": "اسم المتجر",
  "Address": "العنوان",
  "Phone": "الهاتف",
  "Footer message": "رسالة أسفل الفاتورة",
  "Save": "حفظ",
  "Settings saved": "تم حفظ الإعدادات",
  "Settings": "الإعدادات",
  "Language": "اللغة",
  "English": "الإنجليزية",
  "Arabic": "العربية",
  "Invoice History": "سجل الفواتير",
  "receipts saved": "فاتورة محفوظة",
  "Back to register": "العودة إلى الطلبات",
  "Loading invoices…": "جارٍ تحميل الفواتير…",
  "No invoices yet. Print a receipt and it will appear here.": "لا توجد فواتير بعد. ستظهر الفاتورة هنا بعد طباعتها.",
  "Invoice": "الفاتورة",
  "Reprint": "إعادة الطباعة",
  "No line items found for this invoice.": "لم يتم العثور على أصناف لهذه الفاتورة.",
  "Could not load the invoice.": "تعذر تحميل الفاتورة.",
  "Tel": "هاتف",
  "Time": "الوقت",
  "Item": "الصنف",
  "Qty": "الكمية",
  "Close": "إغلاق",
  "Increase quantity": "زيادة الكمية",
  "Decrease quantity": "تقليل الكمية",
  "Delete item": "حذف الصنف",
  "Notifications": "الإشعارات",
  "Page not found": "الصفحة غير موجودة",
  "The page you're looking for doesn't exist or has been moved.": "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
  "Go home": "العودة إلى الرئيسية",
  "This page didn't load": "تعذر تحميل الصفحة",
  "Something went wrong on our end. You can try refreshing or head back home.": "حدث خطأ. يمكنك المحاولة مجدداً أو العودة إلى الرئيسية.",
  "Try again": "المحاولة مجدداً",
};

export function translate(language: Language, text: string) {
  return language === "ar" ? arabic[text] ?? text : text;
}

const LanguageContext = createContext({
  language: "en" as Language,
  setLanguage: (_value: Language) => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem(LANGUAGE_KEY) === "ar") setLanguageState("ar");
    } catch { /* Storage may be unavailable. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const setLanguage = (value: Language) => {
    setLanguageState(value);
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Keep the current selection. */ }
  };
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return {
    ...context,
    dir: context.language === "ar" ? "rtl" as const : "ltr" as const,
    locale: context.language === "ar" ? "ar-SA" : "en-GB",
    t: (text: string) => translate(context.language, text),
  };
}