async function loadUser(userId: string): Promise<string> {
  return `${userId}:user`;
}

async function loadProfile(userId: string): Promise<string> {
  return `${userId}:profile`;
}

function merge(user: string, profile: string): string {
  return `${user}|${profile}`;
}

export async function app(input: { userId: string }): Promise<string> {
  const [user, profile] = await Promise.all([
    loadUser(input.userId),
    loadProfile(input.userId),
  ]);
  const summary = merge(user, profile);
  return summary;
}
