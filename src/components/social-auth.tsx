import { RiGoogleFill } from "@remixicon/react";

import { Button } from "@/components/ui/button";

export type SocialProvider = (typeof providers)[number]["id"];

interface SocialAuthProps {
  onClick: (provider: SocialProvider) => void | Promise<void>;
  mode: "login" | "register";
  enabled?: boolean;
  loadingProvider?: SocialProvider | null;
}

const providers = [
  { id: "google", label: "Google", icon: RiGoogleFill },
] as const;

export default function SocialAuth({
  onClick,
  mode,
  enabled = true,
  loadingProvider = null,
}: SocialAuthProps) {
  const actionText = mode === "login" ? "Sign in" : "Sign up";

  if (!enabled) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map(({ id, label, icon: Icon }) => (
        <Button
          className="w-full"
          disabled={loadingProvider !== null && loadingProvider !== id}
          key={id}
          loading={loadingProvider === id}
          onClick={() => onClick(id)}
          variant="outline"
        >
          <Icon aria-hidden="true" />
          {`${actionText} with ${label}`}
        </Button>
      ))}
    </div>
  );
}
