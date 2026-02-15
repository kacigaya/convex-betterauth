"use client"

import { useId, useMemo, useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  checkStrength,
  getStrengthColor,
} from "@/lib/password-strength"

interface PasswordProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function PasswordLogin({ value = "", onChange }: PasswordProps) {
  const id = useId()
  const [password, setPassword] = useState(value)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setPassword(value)
  }, [value])

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const strength = checkStrength(password)

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length
  }, [strength])

  return (
    <div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={id}>Password</Label>
        <div className="relative">
          <Input
            id={id}
            className="pe-9"
            placeholder="Password"
            type={isVisible ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              onChange?.(e.target.value)
            }}
            aria-describedby={`${id}-description`}
          />
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        className="bg-border mt-3 mb-4 h-1 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={strengthScore}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        <div
          className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
          style={{ width: `${(strengthScore / 4) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}
