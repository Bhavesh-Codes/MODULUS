import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/utils/r2";

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

    // 1. Fetch file record to verify ownership and get size/key
    const { data: vaultItem, error: fetchError } = await supabase
      .from('vault_items')
      .select('*, files(id, r2_object_key, size_bytes)')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !vaultItem) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    const fileRecord = vaultItem.files;

    if (fileRecord?.r2_object_key) {
      // 2. Execute deletion from R2
      try {
        await deleteFileFromR2(fileRecord.r2_object_key);
      } catch (r2Error) {
        console.error("Failed to delete file from R2:", r2Error);
        // We still continue to DB deletion to maintain DB consistency
      }

      // 3. Delete from files table (Supabase rules cascade delete vault_items)
      const { error: fileDeleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileRecord.id);

      if (fileDeleteError) {
        console.error("Failed to delete from files table:", fileDeleteError);
        return NextResponse.json({ error: "Failed to delete file record" }, { status: 500 });
      }

      // 4. Update the users table to subtract the size_bytes
      if (fileRecord.size_bytes) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('storage_used_bytes')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          const currentStorage = userData.storage_used_bytes || 0;
          const newStorage = Math.max(currentStorage - fileRecord.size_bytes, 0);

          await supabase
            .from('users')
            .update({ storage_used_bytes: newStorage })
            .eq('id', user.id);
        }
      }
    } else {
      // If no file record associated, just delete the vault_item
      await supabase
        .from('vault_items')
        .delete()
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vault item DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

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
    const { filename, tags, folder_id } = body as { filename?: string; tags?: string[], folder_id?: string | null };

    if (!filename && tags === undefined && folder_id === undefined) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    // Verify ownership and get linked file_id
    const { data: vaultItem, error: fetchError } = await supabase
      .from('vault_items')
      .select('id, file_id, owner_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !vaultItem) {
      return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    }

    // Update filename in files table if provided
    if (filename && vaultItem.file_id) {
      const { error: fileUpdateError } = await supabase
        .from('files')
        .update({ filename: filename.trim() })
        .eq('id', vaultItem.file_id);

      if (fileUpdateError) {
        console.error("Filename update error:", fileUpdateError);
        return NextResponse.json({ error: "Failed to update filename" }, { status: 500 });
      }
    }

    // Update tags in vault_items table if provided
    if (tags !== undefined) {
      const { error: tagsUpdateError } = await supabase
        .from('vault_items')
        .update({ tags })
        .eq('id', id);

      if (tagsUpdateError) {
        console.error("Tags update error:", tagsUpdateError);
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
      }
    }

    // Update folder_id in vault_items table if provided
    if (folder_id !== undefined) {
      const { error: folderUpdateError } = await supabase
        .from('vault_items')
        .update({ folder_id: folder_id })
        .eq('id', id);

      if (folderUpdateError) {
        console.error("Folder update error:", folderUpdateError);
        return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vault item PATCH error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
