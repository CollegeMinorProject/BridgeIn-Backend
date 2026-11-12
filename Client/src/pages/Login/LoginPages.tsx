import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  PasswordField,
  EmailField,
  GoogleSignInButton,
  OtpField,
  Register,
  LogIn,
} from "@/pages/Login/Components/AuthComponets";
import type { AuthStep } from "./LogInConsts";
import { STEP_COPY, AUTH_STEPS, SUBMIT_LABEL } from "./LogInConsts";
import { useAuth } from "../../hooks/useAuthhook";
export default function LoginForm() {
  const {
    login,
    registerRequest,
    verifyRegister,
    handleGoogleSignIn,
    loading,
    error,
  } = useAuth();
  const [step, setStep] = useState<AuthStep>(AUTH_STEPS[0]);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const goTo = (next: AuthStep) => {
    setFormError(null);
    setStep(next);
  };
  const handleSubmitLogIn = async (): Promise<void> => {
    const data = await login(email, password);
    console.log(data);
  };
  const handleSubmitRegister = async (): Promise<void> => {
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      let response = await registerRequest(userName, email, password);
      if (response == null) {
        alert("Something went wrong");
      } else {
        console.log(response);
        goTo("enterOTPtoVerifyEmailAndLogIn");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleRegisterOTP = async (): Promise<void> => {
    if (otp.length < 5) {
      console.log("OTP Length should be 6");
      return;
    }
    try {
      let response = await verifyRegister(email, otp);
      if (response == null) {
        alert("Something went Wrong");
      } else {
        if (response == null) {
          alert("Something went wrong");
        } else {
          goTo("login");
          console.log(response);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSendLogInOTP = async (): Promise<void> => {
    setFormError(null);
    setSubmitting(true);
    try {
      // TODO: call your API to email a verification code to `email`
      goTo("enterLogInOTP");
    } catch {
      setFormError("Couldn't send the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetPasswordOTP = async (): Promise<void> => {
    setFormError(null);
    setSubmitting(true);
    try {
      // TODO: call your API to email a password-reset code to `email`
      goTo("enterPasswordResetOTP");
    } catch {
      setFormError("Couldn't send the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterLogInOTP = async (): Promise<void> => {
    setFormError(null);
    setSubmitting(true);
    try {
      // TODO: call your API to verify `otp` for `email`, then sign the user in
      setOtp("");
      goTo("login");
    } catch {
      setFormError("That code didn't work. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleSendResetRegisterOTP = async (): Promise<void> => {};
  const handleResetPasswordOTP = async (): Promise<void> => {
    if (newPassword !== confirmNewPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      // TODO: call your API to verify `otp` and set the new password for `email`
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      goTo("login");
    } catch {
      setFormError("That code didn't work. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  useEffect(() => {
    if (step === "getLogInOTP") {
      handleSendLogInOTP();
    }
  }, [step]);
  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    switch (step) {
      case "login":
        handleSubmitLogIn();
        break;
      case "register":
        handleSubmitRegister();
        break;
      case "getLogInOTP":
        handleSendLogInOTP();
        break;
      case "getPasswordResetOTP":
        handleSendResetPasswordOTP();
        break;
      case "enterLogInOTP":
        handleEnterLogInOTP();
        break;
      case "enterPasswordResetOTP":
        handleResetPasswordOTP();
        break;
      case "enterOTPtoVerifyEmailAndLogIn":
        handleRegisterOTP();
        break;
    }
  };
  const { title, subtitle } = STEP_COPY[step];
  const isBusy = step === "login" ? loading : submitting;
  const shownError = step === "login" ? error : formError;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {step !== "login" && (
            <button
              type="button"
              onClick={() => goTo("login")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 -ml-1"
            >
              <ArrowLeft size={16} />
              Back to login
            </button>
          )}

          <p className="text-2xl font-bold text-center text-gray-900">
            {title}
          </p>
          <p className="text-sm text-gray-500 text-center mt-1 mb-6">
            {subtitle(email)}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === "login" && (
              <LogIn
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                goTo={goTo}
              />
            )}
            {step === "register" && (
              <Register
                userName={userName}
                setUserName={setUserName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
              />
            )}
            {step === "enterOTPtoVerifyEmailAndLogIn" && (
              <>
                <OtpField value={otp} onChange={setOtp} />
                <button
                  type="button"
                  onClick={handleSendResetRegisterOTP}
                  disabled={submitting}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start disabled:opacity-60"
                >
                  Resend code
                </button>
              </>
            )}
            {step === "getLogInOTP" && (
              <div className="flex flex-col items-center gap-3 py-4 text-sm text-gray-500">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <p>Hang tight, we&apos;re sending your code…</p>
              </div>
            )}
            {step === "enterLogInOTP" && (
              <>
                <OtpField value={otp} onChange={setOtp} />
                <button
                  type="button"
                  onClick={handleSendLogInOTP}
                  disabled={submitting}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start disabled:opacity-60"
                >
                  Resend code
                </button>
              </>
            )}
            {step === "getPasswordResetOTP" && (
              <EmailField value={email} onChange={setEmail} autoFocus />
            )}
            {step === "enterPasswordResetOTP" && (
              <>
                <OtpField value={otp} onChange={setOtp} />
                <PasswordField
                  id="newPassword"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirmNewPassword"
                  label="Confirm new password"
                  value={confirmNewPassword}
                  onChange={setConfirmNewPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={handleSendResetPasswordOTP}
                  disabled={submitting}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start disabled:opacity-60"
                >
                  Resend code
                </button>
              </>
            )}
            {step !== "getLogInOTP" && (
              <button
                type="submit"
                disabled={isBusy}
                className="mt-2 h-10 rounded-lg bg-blue-600 text-white font-medium transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isBusy && <Loader2 size={16} className="animate-spin" />}
                {SUBMIT_LABEL[step]}
              </button>
            )}
            {shownError && (
              <p className="text-red-500 text-sm text-center -mt-1">
                {shownError}
              </p>
            )}
          </form>

          {step === "login" && (
            <>
              <p className="text-sm text-gray-500 text-center mt-6">
                Don&apos;t have an account?{" "}
                <button
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => goTo("register")}
                >
                  Sign up
                </button>
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="mt-4">
                <GoogleSignInButton onClick={handleGoogleSignIn} />
              </div>
            </>
          )}
          {step === "register" && (
            <>
              <p className="text-sm text-gray-500 text-center mt-6">
                Already have an account?{" "}
                <button
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => goTo("login")}
                >
                  Log in
                </button>
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="mt-4">
                <GoogleSignInButton onClick={handleGoogleSignIn} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
