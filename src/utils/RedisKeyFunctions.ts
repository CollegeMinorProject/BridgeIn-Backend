export function RATE_LIMIT_KEY(scope: string, kind: "ip" | "account", id: string) {
  // Redis Cluster evaluates multi-key scripts only when keys share a hash slot.
  return `rate-limit:v2:{${scope}}:${kind}:${id}`;
}
