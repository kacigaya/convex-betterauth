"use client";

import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelInputContainer } from "@/components/ui/label-input-container";
import {
  checkStrength,
  getStrengthColor,
  getStrengthText,
} from "@/lib/password-strength";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  label: string;
  showRequirements?: boolean;
  matchValue?: string;
};

export function PasswordField({
  id: providedId,
  label,
  showRequirements = false,
  matchValue,
  value = "",
  className,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const descriptionId = `${id}-description`;
  const [isVisible, setIsVisible] = useState(false);
  const password = typeof value === "string" ? value : "";
  const strength = checkStrength(password);
  const strengthScore = strength.filter((requirement) => requirement.met).length;
  const isConfirmation = matchValue !== undefined;
  const isMatch = isConfirmation && password.length > 0 && password === matchValue;
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const describedBy = [
    showRequirements || isConfirmation ? descriptionId : null,
    props["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <LabelInputContainer>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          className={`pe-9 ${className ?? ""}`}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || (isConfirmation && password.length > 0 && !isMatch)}
        />
        <button
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          aria-controls={id}
        >
          {isVisible ? (
            <EyeOffIcon size={16} aria-hidden="true" />
          ) : (
            <EyeIcon size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {showRequirements ? (
        <>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={strength.length}
            aria-label="Password strength"
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)}`}
              style={{ width: `${(strengthScore / strength.length) * 100}%` }}
            />
          </div>
          <div id={descriptionId}>
            <p className="mb-2 text-sm font-medium text-foreground">
              {getStrengthText(strengthScore)}. Password must contain:
            </p>
            <ul className="space-y-1.5">
              {strength.map((requirement) => (
                <li key={requirement.text} className="flex items-center gap-2">
                  {requirement.met ? (
                    <CheckIcon size={16} className="text-emerald-600" aria-hidden="true" />
                  ) : (
                    <XIcon size={16} className="text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span
                    className={`text-xs ${requirement.met ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}
                  >
                    {requirement.text}
                    <span className="sr-only">
                      {requirement.met ? ", requirement met" : ", requirement not met"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {isConfirmation ? (
        <p
          id={descriptionId}
          className={`text-sm ${password.length === 0 ? "text-muted-foreground" : isMatch ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
        >
          {password.length === 0
            ? "Enter the password again."
            : isMatch
              ? "Passwords match."
              : "Passwords do not match."}
        </p>
      ) : null}
    </LabelInputContainer>
  );
}
