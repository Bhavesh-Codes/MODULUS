import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifyRole(supabase: any, communityId: string, userId: string) {
  const { data: member } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()
  return member?.role as string | undefined
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: communityId } = await context.params

    const { data: folders, error } = await supabase
      .from('community_vault_folders')
      .select('*')
      .eq('community_id', communityId)
      .order('name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: folders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: communityId } = await context.params
    const { name, parent_id } = await request.json()

    if (!name?.trim()) return NextResponse.json({ error: "Folder name is required" }, { status: 400 })

    const role = await verifyRole(supabase, communityId, user.id)
    if (role !== 'owner' && role !== 'curator') {
      return NextResponse.json({ error: "Forbidden: You must be an owner or curator to create folders." }, { status: 403 })
    }

    const { data: folder, error } = await supabase
      .from('community_vault_folders')
      .insert({ name: name.trim(), parent_id, community_id: communityId, created_by: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: folder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: communityId } = await context.params
    const folderId = new URL(request.url).searchParams.get("folderId")
    if (!folderId) return NextResponse.json({ error: "folderId query parameter is required" }, { status: 400 })

    const { name, parent_id } = await request.json()
    const updateData: any = {}
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
      updateData.name = name.trim()
    }
    if (parent_id !== undefined) {
      updateData.parent_id = parent_id === "null" || parent_id === "" ? null : parent_id
    }

    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })

    // Role verification — only owner/curator can modify folders
    const role = await verifyRole(supabase, communityId, user.id)
    if (role !== 'owner' && role !== 'curator') {
      return NextResponse.json({ error: "Forbidden: You must be an owner or curator to modify folders." }, { status: 403 })
    }

    // Verify folder belongs to this community
    const { data: existing, error: fetchError } = await supabase
      .from('community_vault_folders')
      .select('id')
      .eq('id', folderId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Folder not found or does not belong to this community" }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('community_vault_folders')
      .update(updateData)
      .eq('id', folderId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Community folder PATCH error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: communityId } = await context.params
    const folderId = new URL(request.url).searchParams.get("folderId")
    if (!folderId) return NextResponse.json({ error: "folderId query parameter is required" }, { status: 400 })

    // Role verification
    const role = await verifyRole(supabase, communityId, user.id)
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

    // Recursive deletion helper
    async function performRecursiveDelete(fid: string) {
      // 1. Delete items in this folder
      const { error: itemError } = await supabase
        .from('community_vault_items')
        .delete()
        .eq('folder_id', fid)
        .eq('community_id', communityId)
      
      if (itemError) throw itemError

      // 2. Find and delete subfolders
      const { data: subfolders } = await supabase
        .from('community_vault_folders')
        .select('id')
        .eq('parent_id', fid)
        .eq('community_id', communityId)

      if (subfolders && subfolders.length > 0) {
        for (const sub of subfolders) {
          await performRecursiveDelete(sub.id)
        }
      }

      // 3. Delete the folder itself
      const { error: folderError } = await supabase
        .from('community_vault_folders')
        .delete()
        .eq('id', fid)
        .eq('community_id', communityId)
      
      if (folderError) throw folderError
    }

    await performRecursiveDelete(folderId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Community folder DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
