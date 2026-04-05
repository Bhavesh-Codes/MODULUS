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

    // Check if user is a member (if community is private? or generally, just fetch it)
    // For now we'll just fetch the items. Row Level Security on DB can protect it, or we just fetch.
    const { data, error } = await supabase
      .from('community_vault_items')
      .select('*, users(*), vault_items(*, files(*))')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Community Vault GET error:", error)
      return NextResponse.json({ error: "Failed to fetch shared vault items" }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Community Vault GET exception:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
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
    const body = await request.json()
    const { vault_item_id } = body

    if (!vault_item_id) {
      return NextResponse.json({ error: "Missing vault_item_id" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('community_vault_items')
      .insert({
        community_id: communityId,
        vault_item_id,
        shared_by_user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Community Vault POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Community Vault POST exception:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
