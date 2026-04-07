import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, tags, folder_id } = body as {
      title: string;
      url: string;
      tags?: string[];
      folder_id?: string | null;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const { data: vaultItem, error: insertError } = await supabase
      .from("vault_items")
      .insert({
        owner_id: user.id,
        item_type: "link",
        title: title.trim(),
        url: url.trim(),
        is_private: true,
        ...(tags && tags.length > 0 ? { tags } : {}),
        ...(folder_id ? { folder_id } : {}),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Vault link insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save link to vault." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: vaultItem });
  } catch (error: any) {
    console.error("Add link route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
