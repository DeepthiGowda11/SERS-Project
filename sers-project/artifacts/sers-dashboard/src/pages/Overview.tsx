import { useGetOverview } from "@workspace/api-client-react";
import { cn, alertDot } from "@/lib/utils";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
      <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-muted-foreground text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { data, isLoading } = useGetOverview();

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const alerts = data?.alertCounts;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time snapshot across all classrooms</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Classrooms" value={data?.totalClassrooms ?? 0} />
        <StatCard label="Students" value={data?.totalStudents ?? 0} />
        <StatCard label="Active Sessions" value={data?.activeSessions ?? 0} />
        <StatCard label="Records Today" value={data?.todayRecords ?? 0} />
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-sm text-foreground mb-4">Today's Alert Distribution</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "green", label: "Engaged", count: alerts?.green ?? 0 },
            { key: "yellow", label: "At Risk", count: alerts?.yellow ?? 0 },
            { key: "red", label: "Distressed", count: alerts?.red ?? 0 },
          ].map(({ key, label, count }) => (
            <div key={key} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <span className={cn("w-3 h-3 rounded-full shrink-0", alertDot(key))} />
              <div>
                <div className="text-2xl font-bold tabular-nums">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
        {(alerts?.total ?? 0) === 0 && (
          <p className="text-muted-foreground text-sm mt-4 text-center">No records logged today yet.</p>
        )}
      </div>
    </div>
  );
}
