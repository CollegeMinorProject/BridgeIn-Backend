export function OTPMAIL(otp: string, minutes: number): string {
  return `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">Your Verification Code</h2>
      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
        Use the one-time code below to complete your verification. This code expires in <strong>${minutes} minutes</strong>.
      </p>
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background-color: #f4f4f7; border-radius: 8px; padding: 20px 36px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #4F46E5; font-family: 'Courier New', Courier, monospace;">
            ${otp}
          </span>
        </div>
      </div>
      <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 10px; text-align: center;">
        Enter this code in the verification screen to continue.
      </p>
      <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center;">
        This code is valid for <strong>${minutes} minutes</strong> and can only be used once.
      </p>
      <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px; text-align: center;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  </div>
`;
}
export function RESETURLMAIL(resetUrl: string): string {
  return `  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">Reset Your Password</h2>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
            We received a request to reset your password. Click the button below to choose a new password. This link will expire shortly for your security.
          </p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
            If the button above doesn't work, copy and paste this link into your web browser:<br><br>
            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all; text-decoration: underline;">
              ${resetUrl}
            </a>
          </p>
          
          <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px; text-align: center;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </div>`;
}
export function VERIFYURL(verifyUrl: string) {
  return `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">Verify Your Email</h2>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
            Thank you for registering! Please verify your email address by clicking the button below. This helps us keep your account secure.
          </p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
            If the button above doesn't work, copy and paste this link into your web browser:<br><br>
            <a href="${verifyUrl}" style="color: #4F46E5; word-break: break-all; text-decoration: underline;">
              ${verifyUrl}
            </a>
          </p>
          
          <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px; text-align: center;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;
}
