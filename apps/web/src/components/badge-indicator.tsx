import { Badge } from "./ui/badge";

interface BadgeIndicatorProps {
  color: string;
  title: string;
}

export default function BadgeIndicator({ color, title }: BadgeIndicatorProps) {
  return (
    <Badge variant={"outline"} className="text-muted-foreground gap-1">
      <span className={`size-1.5 rounded-full ${color}`} />
      {title}
    </Badge>
  );
}
