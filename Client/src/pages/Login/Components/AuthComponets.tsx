import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeClosed, Mail, User } from "lucide-react";
import { useState } from "react";
export function EmailField({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          id="email"
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          autoFocus={autoFocus}
          required
          className="pl-9 h-10 rounded-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
        />
      </div>
    </div>
  );
}
export function UsernameField({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <User
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          id="username"
          type="text"
          value={value}
          onChange={(e) => {
            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
            onChange(sanitizedValue);
          }}
          placeholder="username123"
          autoFocus={autoFocus}
          required
          minLength={6}
          pattern="^[A-Za-z]+[A-Za-z0-9]*$"
          title="Must be at least 6 characters, start with a letter, and contain only letters and numbers."
          className="pl-9 h-10 rounded-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
        />
      </div>
    </div>
  );
}
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  labelRight,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  labelRight?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full h-10 rounded-lg border border-gray-200 pl-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeClosed size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.3 10.3z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.3C39.9 36.6 44 31 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium transition hover:bg-gray-50 flex items-center justify-center gap-2 w-full"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

export function OtpField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="otp">Verification code</Label>
      <Input
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder="123456"
        autoFocus
        required
        className="h-11 rounded-lg border-gray-200 text-center text-lg tracking-[0.5em] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
      />
    </div>
  );
}
type RegisterProps = {
  userName: string;
  setUserName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
};
export function Register({
  userName,
  setUserName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: RegisterProps) {
  return (
    <>
      <UsernameField value={userName} onChange={setUserName} />
      <EmailField value={email} onChange={setEmail} autoFocus />
      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />
    </>
  );
}
import type { AuthStep } from "../LogInConsts";
type LogInProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  goTo: (step: AuthStep) => void;
};

export function LogIn({
  email,
  setEmail,
  password,
  setPassword,
  goTo,
}: LogInProps) {
  return (
    <>
      <EmailField value={email} onChange={setEmail} autoFocus />
      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        labelRight={
          <button
            type="button"
            onClick={() => goTo("getPasswordResetOTP")}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </button>
        }
      />
    </>
  );
}
