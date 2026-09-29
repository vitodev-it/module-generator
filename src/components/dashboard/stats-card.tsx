import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCard({
  title,
  value,
  accent = "ember",
  icon,
}: {
  title: string;
  value: string | number;
  accent?: "ember" | "sage" | "gold";
  icon: React.ReactNode;
}) {
  const accentColors = {
    ember: "text-[#0A0A0B]",
    sage: "text-[#22C55E]",
    gold: "text-[#0070F3]",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#666666]">
          {title}
        </CardTitle>
        <div className={`${accentColors[accent]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accentColors[accent]}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
