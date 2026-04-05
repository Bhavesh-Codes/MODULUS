import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await context.params
    const communityId = resolvedParams.id

    const { data: folders, error: folderError } = await supabase
      .from('community_vault_folders')
      .select('*')
      .eq('community_id', communityId)
      .order('name', { ascending: true })

    if (folderError) {
      return NextResponse.json({ error: folderError.message }, { status: 400 })
    }

    return NextResponse.json({ data: folders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await context.params
    const communityId = resolvedParams.id
    const { name, parent_id } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Role verification
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const role = member?.role
    if (role !== 'owner' && role !== 'curator') {
       return NextResponse.json({ error: "Forbidden: You must be an owner or curator to create folders." }, { status: 403 })
    }

    const { data: folder, error: insertError } = await supabase
      .from('community_vault_folders')
      .insert({ name, parent_id, community_id: communityId, created_by: user.id })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ data: folder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
