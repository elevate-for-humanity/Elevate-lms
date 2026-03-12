import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const sessionId = formData.get('sessionId')

    if (!(file instanceof File) || typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json(
        { error: 'file and sessionId are required' },
        { status: 400 }
      )
    }

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'webm'
    const path = `exam-recordings/${sessionId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, arrayBuffer, {
        contentType: file.type || 'video/webm',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(path)

    const publicUrl = publicUrlData?.publicUrl ?? null

    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        recording_url: publicUrl,
        evidence_url: publicUrl
      })
      .eq('id', sessionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, path, publicUrl })
  } catch (error) {
    console.error('POST /api/exams/upload-recording failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
