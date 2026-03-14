import { createSupabaseClient } from "@/lib/supabase-api";

// Bucket name: create a bucket in Supabase called "compliance-evidence"
const BUCKET = "compliance-evidence";

export async function uploadComplianceEvidenceFile(
  file: File,
  itemId: string
) {
  const supabase = createSupabaseClient();
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `items/${itemId}/${fileName}`;

  const { data, error} = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Error: $1
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    fileUrl: publicUrl,
    fileName: file.name,
  };
}
