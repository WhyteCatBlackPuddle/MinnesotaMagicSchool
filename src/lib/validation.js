export function requireTextFields(record, fields) {
  for (const field of fields) {
    if (!record[field] || !String(record[field]).trim()) {
      return field;
    }
  }
  return null;
}

export function normalizeTraits(traits) {
  return JSON.stringify(Array.isArray(traits) ? traits : []);
}
