export const PASSWORD_REQUIREMENTS = [
  { regex: /^[\s\S]{8,128}$/, text: "Between 8 and 128 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
] as const;

export function getPasswordIssues(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter(
    (requirement) => !requirement.regex.test(password),
  ).map((requirement) => requirement.text);
}

export function checkStrength(password: string) {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    met: req.regex.test(password),
    text: req.text,
  }));
}

export function getStrengthScore(password: string): number {
  return checkStrength(password).filter((req) => req.met).length;
}

export function getStrengthColor(score: number): string {
  if (score === 0) return "bg-border";
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score === 3) return "bg-amber-500";
  return "bg-emerald-500";
}

export function getStrengthText(score: number): string {
  if (score === 0) return "Enter a password";
  if (score <= 2) return "Weak password";
  if (score === 3) return "Medium password";
  return "Strong password";
}
