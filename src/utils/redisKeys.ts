export function RedisEmailOTPKey(email: string) {
  return `email:${email}`;
}
