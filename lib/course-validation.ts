export function validateCourse(json: string) {
  try {
    const data = JSON.parse(json);
    if (!data.title) throw new Error('Missing course title');
    return { ok: true, data };
  } catch (err: any) {
    return {
      ok: false,
      error: 'Operation failed',
    };
  }
}
