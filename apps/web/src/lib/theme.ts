export type ThemePreference = "system" | "light" | "dark"

const THEME_STORAGE_KEY = "muzigal.theme"

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system"
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemePreference(stored) ? stored : "system"
}

export function setThemePreference(value: ThemePreference) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, value)
  window.dispatchEvent(
    new CustomEvent("theme-preference-change", { detail: value })
  )
}

export function getResolvedTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") {
    return preference
  }

  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return
  }

  const resolvedTheme = getResolvedTheme(preference)
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
}

export function watchSystemThemeChange(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const handleChange = () => onChange()

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }

  mediaQuery.addListener(handleChange)
  return () => mediaQuery.removeListener(handleChange)
}

export function getThemeStorageKey() {
  return THEME_STORAGE_KEY
}
