import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";

export const TransactionsTab = () => {
  const { data: payments = [], isLoading } = usePaymentHistory();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusClass = (status: string) => {
    if (status === "SUCCESS") return "bg-primary text-primary-foreground";
    if (status === "FAILED") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Transaction History</h2>
        <p className="text-muted-foreground mt-2">View your M-Pesa payment history</p>
      </div>

      {isLoading ? (
        <Card className="glass border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading transactions…</p>
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="glass border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Receipt className="w-16 h-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">Your payment history will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              All Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20 hover:bg-primary/5">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{payment.plan.name}</TableCell>
                      <TableCell className="font-semibold gradient-text">
                        KES {payment.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(payment.status)}>{payment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
