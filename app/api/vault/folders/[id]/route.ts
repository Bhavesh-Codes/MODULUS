import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parent_id } = body as { name?: string; parent_id?: string | null };

    if (!name && parent_id === undefined) {
      return NextResponse.json({ error: "Nothing to update. Provide name or parent_id." }, { status: 400 });
    }

    // Verify ownership of the folder
    const { data: folder, error: fetchError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .eq("scope", "vault")
      .single();

    if (fetchError || !folder) {
      return NextResponse.json({ error: "Folder not found or access denied" }, { status: 404 });
    }

    // Prepare update payload
    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (parent_id !== undefined) updates.parent_id = parent_id;

    const { error: updateError } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Folder update error:", updateError);
      return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Folder PATCH error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: folder, error: fetchError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .eq("scope", "vault")
      .single();

    if (fetchError || !folder) {
      return NextResponse.json({ error: "Folder not found or access denied" }, { status: 404 });
    }

    // User rule: "if the user deletes the folder move the files in that folder to all files." (root level)
    // 1. Move all vault_items in this folder to root
    const { error: itemsUpdateError } = await supabase
      .from("vault_items")
      .update({ folder_id: null })
      .eq("folder_id", id);

    if (itemsUpdateError) {
      console.error("Failed to move child items:", itemsUpdateError);
      return NextResponse.json({ error: "Failed to move child items to root. Deletion aborted." }, { status: 500 });
    }

    // 2. Move any sub-folders to root
    const { error: foldersUpdateError } = await supabase
      .from("folders")
      .update({ parent_id: null })
      .eq("parent_id", id);

    if (foldersUpdateError) {
      console.error("Failed to move child folders:", foldersUpdateError);
      return NextResponse.json({ error: "Failed to move sub-folders to root. Deletion aborted." }, { status: 500 });
    }

    // 3. Delete the folder itself
    const { error: deleteError } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Folder delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Folder DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
