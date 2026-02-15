"use client"

import { useId, useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

interface PasswordConfirmProps {
  originalPassword: string
  value?: string
  onChange?: (value: string) => void
}

export default function PasswordConfirm({ originalPassword, value = "", onChange }: PasswordConfirmProps) {
  const id = useId()
  const [confirmPassword, setConfirmPassword] = useState(value)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    setConfirmPassword(value)
  }, [value])

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const isPasswordMatch = confirmPassword === originalPassword && confirmPassword.length > 0

  const getMatchColor = () => {
    if (confirmPassword.length === 0) return "bg-border"
    return isPasswordMatch ? "bg-emerald-500" : "bg-red-500"
  }

  const getMatchText = () => {
    if (confirmPassword.length === 0) return "Enter confirmation password"
    return isPasswordMatch ? "Passwords match" : "Passwords do not match"
  }

  return (
    <div>
      {/* Password confirmation input field with toggle visibility button */}
      <div className="*:not-first:mt-2">
        <div className="relative">
          <Input
            id={id}
            className="pe-9"
            placeholder="Confirm password"
            type={isVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
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
            aria-controls="confirm-password"
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Password match indicator */}
      <div
        className="bg-border mt-3 mb-4 h-1 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={isPasswordMatch ? 1 : 0}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-label="Password match status"
      >
        <div
          className={`h-full ${getMatchColor()} transition-all duration-500 ease-out`}
          style={{ width: `${isPasswordMatch ? 100 : 0}%` }}
        ></div>
      </div>

      {/* Password match description */}
      <p
        id={`${id}-description`}
        className="text-foreground mb-2 text-sm font-medium"
      >
        {getMatchText()}.
      </p>
    </div>
  )
}
