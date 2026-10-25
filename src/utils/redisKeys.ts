export function RedisEmailOTPKey(email: string) {
  return `email:${email}`;
}
export function RedisEmailVerificationKey(email: string, token: string) {
  return `emailVerification${email},token:${token}`;
}
