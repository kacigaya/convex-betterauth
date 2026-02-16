import {
  RiGoogleFill,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface SocialAuthProps {
  onClick: (provider: string) => void | Promise<void> | Promise<unknown>;
  mode: "login" | "register";
}

const providers = [
  { id: "google", label: "Google", icon: RiGoogleFill, bg: "bg-[#DB4437]", hover: "hover:bg-[#DB4437]/90" },
] as const;

export default function SocialAuth({ onClick, mode }: SocialAuthProps) {
  const actionText = mode === "login" ? "Login" : "Register";

  return (
    <div className="flex flex-col gap-2">
      {providers.map(({ id, label, icon: Icon, bg, hover }) => (
        <Button
          key={id}
          className={`${bg} text-white after:flex-1 ${hover}`}
          onClick={() => onClick(id)}
        >
          <span className="pointer-events-none me-2 flex-1">
            <Icon className="opacity-60" size={16} aria-hidden="true" />
          </span>
          {actionText} with {label}
        </Button>
      ))}
    </div>
  );
}
