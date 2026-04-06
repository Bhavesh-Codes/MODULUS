import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all vault-scoped folders the user owns, ordered by name
    const { data, error } = await supabase
      .from("folders")
      .select("id, name, parent_id")
      .eq("owner_id", user.id)
      .eq("scope", "vault")
      .order("name", { ascending: true });

    if (error) {
      console.error("Folders fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Folders GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parent_id } = body as { name?: string; parent_id?: string | null };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // If parent_id is provided, verify the parent belongs to this user
    if (parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from("folders")
        .select("id")
        .eq("id", parent_id)
        .eq("owner_id", user.id)
        .eq("scope", "vault")
        .single();

      if (parentError || !parent) {
        return NextResponse.json({ error: "Parent folder not found or access denied" }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from("folders")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        parent_id: parent_id ?? null,
        scope: "vault",
      })
      .select()
      .single();

    if (error) {
      console.error("Folder create error:", error);
      return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Folders POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
