interface ValidationResult {
  ok: true;
  data: { title: string; modules?: unknown[] };
}

interface ValidationError {
  ok: false;
  error: string;
}

export function validateCourse(json: string): ValidationResult | ValidationError {
  if (!json) {
    return { ok: false, error: 'Operation failed' };
  }
  try {
    const parsed = JSON.parse(json);
    if (!parsed.title) {
      return { ok: false, error: 'Operation failed' };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: 'Operation failed' };
  }
}
