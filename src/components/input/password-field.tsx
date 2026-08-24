"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";
import { cn } from "@/lib/utils";
import {
  PASSWORD_REQUIREMENTS,
  checkStrength,
  getStrengthColor,
  getStrengthText,
} from "@/lib/password-strength";

type PasswordFieldProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  label: string;
  showRequirements?: boolean;
  matchValue?: string;
};

export function PasswordField({
  label,
  showRequirements = false,
  matchValue,
  value = "",
  ...props
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const password = typeof value === "string" ? value : "";
  const requirements = checkStrength(password);
  const strengthScore = requirements.filter(
    (requirement) => requirement.met,
  ).length;
  const isConfirmation = matchValue !== undefined;
  const isMismatch =
    isConfirmation && password.length > 0 && password !== matchValue;

  return (
    <Field invalid={isMismatch}>
      <FieldLabel>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          {...props}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <InputGroupAddon align="inline-end">
          <Button
            aria-label={
              isVisible
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            aria-pressed={isVisible}
            onClick={() => setIsVisible((visible) => !visible)}
            size="icon-sm"
            variant="ghost"
          >
            {isVisible ? (
              <EyeOffIcon aria-hidden="true" />
            ) : (
              <EyeIcon aria-hidden="true" />
            )}
          </Button>
        </InputGroupAddon>
      </InputGroup>

      {showRequirements ? (
        <>
          <Meter
            aria-label="Password strength"
            max={PASSWORD_REQUIREMENTS.length}
            value={strengthScore}
          >
            <MeterTrack className="h-1 rounded-full">
              <MeterIndicator
                className={cn("rounded-full", getStrengthColor(strengthScore))}
              />
            </MeterTrack>
          </Meter>
          <FieldDescription render={<div />}>
            <p className="font-medium text-foreground">
              {getStrengthText(strengthScore)}. Password must contain:
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {requirements.map((requirement) => (
                <li className="flex items-center gap-2" key={requirement.text}>
                  {requirement.met ? (
                    <CheckIcon aria-hidden="true" className="size-4 text-success" />
                  ) : (
                    <XIcon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  )}
                  <span
                    className={
                      requirement.met ? "text-success-foreground" : undefined
                    }
                  >
                    {requirement.text}
                    <span className="sr-only">
                      {requirement.met
                        ? ", requirement met"
                        : ", requirement not met"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </FieldDescription>
        </>
      ) : null}

      {isConfirmation ? (
        isMismatch ? (
          <FieldError match>Passwords do not match.</FieldError>
        ) : (
          <FieldDescription>
            {password.length === 0
              ? "Enter the password again."
              : "Passwords match."}
          </FieldDescription>
        )
      ) : null}
    </Field>
  );
}
