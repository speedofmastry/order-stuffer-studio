import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const next = language === "ar" ? "en" : "ar";
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(next)}
      aria-label={next === "ar" ? "العربية" : "English"}
    >
      <Languages className="h-4 w-4" />
      <span className="ms-1">{next === "ar" ? "ع" : "EN"}</span>
    </Button>
  );
}
