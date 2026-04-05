import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeInternalError } from '@/lib/api/safe-error'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('docType') as string | null
    const partnerId = formData.get('partnerId') as string | null
    const token = formData.get('token') as string | null

    if (!file || !docType || !partnerId || !token) {
      return safeError('Missing required fields', 400)
    }

    const supabase = createAdminClient()

    // Verify token matches partner
    const { data: partner } = await supabase
      .from('partners')
      .select('id, onboarding_step')
      .eq('id', partnerId)
      .eq('onboarding_step', token)
      .single()

    if (!partner) {
      return safeError('Invalid upload link', 403)
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${partnerId}/${docType}-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('partner_documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      return safeInternalError(uploadError, 'Storage upload failed')
    }

    // Record in partner_documents if table exists, otherwise just return success
    await supabase.from('partner_documents').insert({
      partner_id: partnerId,
      doc_type: docType,
      file_name: file.name,
      storage_path: path,
      status: 'pending',
    }).then(() => {}).catch(() => {}) // non-fatal if table doesn't exist yet

    return NextResponse.json({ success: true, path })
  } catch (err) {
    return safeInternalError(err, 'Upload failed')
  }
}
