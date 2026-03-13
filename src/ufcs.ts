interface UfcsExpression {
  receiverId: string;
  calleeIds: string[];
}

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const QUALIFIED_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}

function isQualifiedIdentifier(value: string): boolean {
  return QUALIFIED_IDENTIFIER_PATTERN.test(value);
}

function parseUfcsExpression(line: string): UfcsExpression | null {
  const trimmed = line.trim();
  if (
    trimmed.length === 0 ||
    trimmed.startsWith('(') ||
    trimmed.startsWith('//')
  ) {
    return null;
  }

  let cursor = 0;
  let receiverId = '';
  const calleeIds: string[] = [];

  const firstCallMatch = trimmed
    .slice(cursor)
    .match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
  if (firstCallMatch) {
    const calleeId = firstCallMatch[1]?.trim();
    const receiver = firstCallMatch[2]?.trim();
    if (!calleeId || !receiver) {
      return null;
    }

    if (!isQualifiedIdentifier(calleeId) || !isIdentifier(receiver)) {
      return null;
    }

    receiverId = receiver;
    calleeIds.push(calleeId);
    cursor += firstCallMatch[0].length;
  } else {
    const receiverMatch = trimmed
      .slice(cursor)
      .match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    const receiver = receiverMatch?.[1]?.trim();
    if (!receiver || !isIdentifier(receiver)) {
      return null;
    }

    receiverId = receiver;
    cursor += receiver.length;
  }

  while (cursor < trimmed.length) {
    const callMatch = trimmed
      .slice(cursor)
      .match(/^\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)/);
    const calleeId = callMatch?.[1]?.trim();
    if (!callMatch || !calleeId || !isIdentifier(calleeId)) {
      return null;
    }

    calleeIds.push(calleeId);
    cursor += callMatch[0].length;
  }

  if (calleeIds.length === 0) {
    return null;
  }

  return { receiverId, calleeIds };
}

function lowerUfcsExpression(expression: UfcsExpression): string[] {
  const loweredEdges: string[] = [];
  let currentSourceId = expression.receiverId;

  for (const calleeId of expression.calleeIds) {
    loweredEdges.push(`(${currentSourceId})-[:PROCESS]->(${calleeId})`);
    currentSourceId = calleeId;
  }

  return loweredEdges;
}

export function lowerUfcsLine(line: string): string[] {
  const expression = parseUfcsExpression(line);
  if (!expression) {
    return [line];
  }

  return lowerUfcsExpression(expression);
}

export function lowerUfcsSource(source: string): string {
  return source
    .split('\n')
    .flatMap((line) => lowerUfcsLine(line))
    .join('\n');
}
