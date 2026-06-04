import { createClient } from '@/lib/supabase'
import type { DBNotification } from '@/types'

/** Fetch all DB notifications for the current user, newest first. */
export async function getDBNotifications(): Promise<DBNotification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, message, entity_type, entity_id, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[notifications] fetch error:', error.message)
    return []
  }

  return (data ?? []).map((n) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type as DBNotification['type'],
    title: n.title,
    message: n.message,
    entity_type: n.entity_type ?? undefined,
    entity_id: n.entity_id ?? undefined,
    read_at: n.read_at ?? undefined,
    created_at: n.created_at,
  }))
}

/** Mark a single notification as read. */
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('mark_notification_read', { p_notification_id: id })
}

/** Mark all unread notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('mark_all_notifications_read')
}
