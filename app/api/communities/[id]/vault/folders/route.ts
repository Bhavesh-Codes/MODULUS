import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await context.params
    const communityId = resolvedParams.id

    // Parse folder ID from query param
    const url = new URL(request.url)
    const folderId = url.searchParams.get("folderId")

    if (!folderId) {
      return NextResponse.json({ error: "folderId query parameter is required" }, { status: 400 })
    }

    // Role verification — only owner/curator can delete folders
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const role = member?.role
    if (role !== 'owner' && role !== 'curator') {
      return NextResponse.json({ error: "Forbidden: You must be an owner or curator to delete folders." }, { status: 403 })
    }

    // Verify folder belongs to this community
    const { data: folder, error: fetchError } = await supabase
      .from('community_vault_folders')
      .select('id')
      .eq('id', folderId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !folder) {
      return NextResponse.json({ error: "Folder not found or does not belong to this community" }, { status: 404 })
    }

    // 1. Move items in the folder to root (folder_id = null)
    const { error: itemsMoveError } = await supabase
      .from('community_vault_items')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
      .eq('community_id', communityId)

    if (itemsMoveError) {
      console.error("Failed to move items to root:", itemsMoveError)
      return NextResponse.json({ error: "Failed to move items to root. Deletion aborted." }, { status: 500 })
    }

    // 2. Move sub-folders to root (parent_id = null)
    const { error: subfoldersMoveError } = await supabase
      .from('community_vault_folders')
      .update({ parent_id: null })
      .eq('parent_id', folderId)
      .eq('community_id', communityId)

    if (subfoldersMoveError) {
      console.error("Failed to move sub-folders to root:", subfoldersMoveError)
      return NextResponse.json({ error: "Failed to move sub-folders to root. Deletion aborted." }, { status: 500 })
    }

    // 3. Delete the folder itself
    const { error: deleteError } = await supabase
      .from('community_vault_folders')
      .delete()
      .eq('id', folderId)
      .eq('community_id', communityId)

    if (deleteError) {
      console.error("Folder delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Community folder DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
