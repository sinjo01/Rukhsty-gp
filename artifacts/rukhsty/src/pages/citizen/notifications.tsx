import { useListNotifications, getListNotificationsQueryKey, useMarkNotificationRead, useMarkAllRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Info, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  INFO: { icon: Info, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  SUCCESS: { icon: CheckCircle, color: "text-green-500 bg-green-50 dark:bg-green-950/30" },
  WARNING: { icon: AlertCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  ERROR: { icon: XCircle, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
};

export default function Notifications() {
  const { isRTL, pick } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: notifications, isLoading } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    toast({ title: pick("All notifications marked as read", "تم تحديد جميع الإشعارات كمقروءة") });
  };

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pick("Notifications", "الإشعارات")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount > 0 ? pick(`${unreadCount} unread`, `${unreadCount} غير مقروء`) : pick("All caught up", "لا توجد إشعارات جديدة")}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAll} disabled={markAll.isPending} data-testid="btn-mark-all-read">
            <CheckCheck className="w-4 h-4" /> {pick("Mark all read", "تحديد الكل كمقروء")}
          </Button>
        )}
      </motion.div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">{pick("No notifications", "لا توجد إشعارات")}</h3>
          <p className="text-muted-foreground text-sm mt-1">{pick("You'll see updates about your application here", "ستظهر تحديثات طلبك هنا")}</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications?.map((notif: any, i: number) => {
          const config = TYPE_ICONS[notif.type] ?? TYPE_ICONS.INFO;
          const Icon = config.icon;
          return (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card
                className={`transition-all cursor-pointer hover:shadow-sm ${!notif.isRead ? "border-primary/30 bg-primary/[0.02]" : "opacity-80"}`}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                data-testid={`notification-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-tight ${notif.isRead ? "text-muted-foreground" : "text-foreground"}`}>{notif.title}</p>
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
