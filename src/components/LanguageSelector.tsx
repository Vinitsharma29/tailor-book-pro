import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

interface LanguageSelectorProps {
  variant?: "light" | "dark";
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = "dark" }) => {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem("language", value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className={`w-4 h-4 ${variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
      <Select value={i18n.language} onValueChange={handleChange}>
        <SelectTrigger
          className={`w-[110px] h-8 text-xs ${
            variant === "light"
              ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
              : ""
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
