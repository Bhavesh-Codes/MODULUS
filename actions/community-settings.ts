"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

interface UpdateCommunityDetailsData {
  name: string
  description?: string
  type: string
  banner_url?: string
}

async function verifyOwner(supabase: any, communityId: string): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return false

  const { data: membershipData, error: membershipError } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", authData.user.id)
    .single()

  if (membershipError || !membershipData || membershipData.role !== 'owner') {
    return false
  }

  return true
}

export async function updateCommunityDetails(communityId: string, data: UpdateCommunityDetailsData) {
  const supabase = await createClient()

  const isOwner = await verifyOwner(supabase, communityId)
  if (!isOwner) {
    throw new Error("Unauthorized. Only the owner can update community details.")
  }

  const { error } = await supabase
    .from("communities")
    .update({
      name: data.name,
      description: data.description || null,
      type: data.type,
      banner_url: data.banner_url || null,
    })
    .eq("id", communityId)

  if (error) {
    console.error("Error updating community details:", error)
    throw new Error("Failed to update community details.")
  }

  revalidatePath(`/communities/${communityId}`)
  return { success: true }
}

export async function getCommunityMembers(communityId: string) {
  const supabase = await createClient()

  // Verify the user is at least a member before exposing roster
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
     throw new Error("Unauthorized")
  }
  
  const { data: membershipData } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", authData.user.id)
    .single()
    
  if (!membershipData) {
      throw new Error("You must be a member to view the roster")
  }

  const { data, error } = await supabase
    .from("community_members")
    .select(`
      role,
      user_id,
      users:user_id (
        id,
        name,
        email,
        profile_pic
      )
    `)
    .eq("community_id", communityId)

  if (error) {
    console.error("Error fetching community members:", error)
    throw new Error("Failed to fetch community members.")
  }

  // Format the data nicely
  const formattedData = data.map((item: any) => ({
      id: item.users.id,
      name: item.users.name,
      email: item.users.email,
      profile_pic: item.users.profile_pic,
      role: item.role
  }))

  return formattedData
}

export async function updateMemberRole(communityId: string, userId: string, newRole: string) {
  const supabase = await createClient()

  const isOwner = await verifyOwner(supabase, communityId)
  if (!isOwner) {
    throw new Error("Unauthorized. Only the owner can update member roles.")
  }

  // Double check that we are not trying to demote the owner
   const { data: currentTargetData } = await supabase
   .from("community_members")
   .select("role")
   .eq("community_id", communityId)
   .eq("user_id", userId)
   .single()

   if (currentTargetData?.role === 'owner') {
       throw new Error("Cannot change role of the owner.")
   }

  const { error } = await supabase
    .from("community_members")
    .update({ role: newRole })
    .eq("community_id", communityId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating member role:", error)
    throw new Error("Failed to update member role.")
  }

  revalidatePath(`/communities/${communityId}`)
  return { success: true }
}

export async function removeMember(communityId: string, userId: string) {
  const supabase = await createClient()

  const isOwner = await verifyOwner(supabase, communityId)
  if (!isOwner) {
    throw new Error("Unauthorized. Only the owner can remove members.")
  }
  
  // Double check that we are not trying to kick the owner
  const { data: currentTargetData } = await supabase
  .from("community_members")
  .select("role")
  .eq("community_id", communityId)
  .eq("user_id", userId)
  .single()

  if (currentTargetData?.role === 'owner') {
      throw new Error("Cannot kick the owner.")
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error removing member:", error)
    throw new Error("Failed to remove member.")
  }

  // Update member count cache in communities table
  const { data: memberCountData } = await supabase
  .from('community_members')
  .select('*', { count: 'exact', head: true })
  .eq('community_id', communityId)
  .in('role', ['owner', 'curator', 'peer'])

  if (memberCountData !== null) {
      // It returns null but actually sets count in a property if destructured. 
      // Supabase js V2 way to get count:
      const countRes = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', communityId)
            .in('role', ['owner', 'curator', 'peer'])
            
      await supabase.from('communities').update({ member_count: countRes.count || 0 }).eq('id', communityId)
  }

  revalidatePath(`/communities/${communityId}`)
  return { success: true }
}

export async function deleteCommunity(communityId: string) {
  const supabase = await createClient()

  const isOwner = await verifyOwner(supabase, communityId)
  if (!isOwner) {
    throw new Error("Unauthorized. Only the owner can delete the community.")
  }

  const { error } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId)

  if (error) {
    console.error("Error deleting community:", error)
    throw new Error("Failed to delete community.")
  }

  // Assume cascading deletes are handled in DB as stated
  revalidatePath("/communities")
  return { success: true }
}
