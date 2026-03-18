function greet(name: string): string {
  return `hello:${name}`;
}

export function app(input: { name: string }): string {
  const message = greet(input.name);
  return message;
}
