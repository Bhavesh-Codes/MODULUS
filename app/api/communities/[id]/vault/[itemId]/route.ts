import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, context: { params: Promise<{ id: string, itemId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = (await context.params) as any
    const vaultItemId = resolvedParams.vaultItemId || resolvedParams.itemId
    const communityId = resolvedParams.id

    // 1. Fetch the vault item back to check who shared it
    const { data: vaultItem, error: fetchError } = await supabase
      .from('community_vault_items')
      .select('shared_by_user_id')
      .eq('id', vaultItemId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !vaultItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // 2. Fetch user's role in the community using community_members
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const isSharer = vaultItem.shared_by_user_id === user.id
    const isPrivileged = member?.role === 'owner' || member?.role === 'curator'

    if (!isSharer && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden. You are not allowed to remove this item." }, { status: 403 })
    }

    // 3. Perform delete
    const { error: deleteError } = await supabase
      .from('community_vault_items')
      .delete()
      .eq('id', vaultItemId)

    if (deleteError) {
      console.error("Community Vault DELETE error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Community Vault DELETE exception:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string, itemId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = (await context.params) as any
    const vaultItemId = resolvedParams.vaultItemId || resolvedParams.itemId
    const communityId = resolvedParams.id
    
    const body = await request.json()
    const { tags, folder_id } = body

    // Route authorization: strictly 'owner' or 'curator' check
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const role = member?.role
    if (role !== 'owner' && role !== 'curator') {
       return NextResponse.json({ error: "Forbidden: Only owners and curators can organize shared variables." }, { status: 403 })
    }

    const unassignedFolderId = folder_id === "null" || folder_id === null || folder_id === "" ? null : folder_id

    // Use exact keys user mapped
    const { data, error: updateError } = await supabase
       .from('community_vault_items')
       .update({ tags, folder_id: unassignedFolderId })
       .eq('id', vaultItemId)
       .select()
       .single()

    if (updateError) {
       console.error("Community Vault PATCH error:", updateError)
       return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Community Vault PATCH exception:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
