import { useTranslation } from "react-i18next"

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
] as const

export default function LanguageSwitch() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded border border-gray-400 overflow-hidden text-sm font-mono"
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
          className={`px-2 py-1 cursor-pointer transition-colors ${
            current === code
              ? "bg-neutral-200 dark:bg-neutral-300 text-neutral-200 dark:text-neutral-700"
              : "bg-transparent text-neutral-700 dark:text-neutral-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}