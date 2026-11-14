/** Read a browser File as a data URL for JSON API upload (host shop applications). */
export async function encodeDataUrlFile(file: File | null): Promise<string> {
  if (!file) return '';
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
