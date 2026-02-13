import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  applyTheme,
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme";

export function SettingsPage() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    () => getThemePreference(),
  );

  useEffect(() => {
    applyTheme(themePreference);
  }, [themePreference]);

  const handleThemeChange = (value: ThemePreference) => {
    setThemePreferenceState(value);
    setThemePreference(value);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Update your preferences for appearance and system behavior.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how Muzigal should look on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={themePreference}
            onValueChange={(value) =>
              handleThemeChange(value as ThemePreference)
            }
            className="max-w-sm"
          >
            <FieldLabel htmlFor="theme-system">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>System</FieldTitle>
                  <FieldDescription>
                    Match your device appearance settings.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="system" id="theme-system" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="theme-light">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Light</FieldTitle>
                  <FieldDescription>
                    Always use a light background.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="light" id="theme-light" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="theme-dark">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Dark</FieldTitle>
                  <FieldDescription>
                    Always use a dark background.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="dark" id="theme-dark" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
