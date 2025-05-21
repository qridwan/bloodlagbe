export function convertToCamelCase(str: string): string {
  // First, handle potential spaces by replacing them with underscores, then lowercase everything
  const normalizedStr = str.trim().toLowerCase().replace(/\s+/g, '_');

  return normalizedStr.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function convertKeysToCamel(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const newKey = convertToCamelCase(key);
      acc[newKey] = value;
      return acc;
    },
    {} as Record<string, any>
  );
}
