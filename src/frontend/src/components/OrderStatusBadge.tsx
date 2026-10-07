import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  accepted: "bg-secondary text-secondary-foreground",
  assembling: "bg-warning/20 text-warning-foreground",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("rounded-full border-0", STATUS_STYLES[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
