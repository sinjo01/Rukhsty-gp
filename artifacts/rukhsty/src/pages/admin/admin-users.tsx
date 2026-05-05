import { useListAdminUsers, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Users, User } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TRAINING_CENTER_OFFICER: "bg-amber-100 text-amber-700",
  MEDICAL_CENTER_OFFICER: "bg-green-100 text-green-700",
  THEORY_EXAM_OFFICER: "bg-cyan-100 text-cyan-700",
  PRACTICAL_EXAM_OFFICER: "bg-indigo-100 text-indigo-700",
  DVLD_OFFICER: "bg-rose-100 text-rose-700",
};

export default function AdminUsers() {
  const { data, isLoading } = useListAdminUsers({} as any, { query: { queryKey: getListAdminUsersQueryKey({} as any) } });
  const users = (data as any)?.data ?? data ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">All registered platform users</p>
      </motion.div>

      {isLoading && <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-16" />)}</div>}

      <div className="space-y-2">
        {users.map((user: any, i: number) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-700"}`}>
                      {user.role?.replace(/_/g, " ")}
                    </Badge>
                    {!user.isActive && <Badge className="text-xs bg-red-100 text-red-700">Inactive</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {!isLoading && users.length === 0 && <div className="text-center py-16 text-muted-foreground">No users found</div>}
      </div>
    </div>
  );
}
