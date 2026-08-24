import {
  RiGoogleFill,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"

export type SocialProvider = (typeof providers)[number]["id"];

interface SocialAuthProps {
  onClick: (provider: SocialProvider) => void | Promise<void>;
  mode: "login" | "register";
  enabled?: boolean;
  loadingProvider?: SocialProvider | null;
}

const providers = [
  { id: "google", label: "Google", icon: RiGoogleFill, bg: "bg-[#DB4437]", hover: "hover:bg-[#DB4437]/90" },
] as const;

export default function SocialAuth({
  onClick,
  mode,
  enabled = true,
  loadingProvider = null,
}: SocialAuthProps) {
  const actionText = mode === "login" ? "Login" : "Register";

  if (!enabled) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map(({ id, label, icon: Icon, bg, hover }) => (
        <Button
          key={id}
          type="button"
          className={`${bg} text-white after:flex-1 ${hover}`}
          onClick={() => onClick(id)}
          disabled={loadingProvider !== null}
          aria-busy={loadingProvider === id}
        >
          <span className="pointer-events-none me-2 flex-1">
            <Icon className="opacity-60" size={16} aria-hidden="true" />
          </span>
          {loadingProvider === id ? "Connecting..." : `${actionText} with ${label}`}
        </Button>
      ))}
    </div>
  );
}
