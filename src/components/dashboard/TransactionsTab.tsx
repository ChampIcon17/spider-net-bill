import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactions } from "@/ui/hooks/useAppState";

interface Transaction {
  id: string;
  plan: string;
  duration: string;
  amount: number;
  date: string;
  status: string;
}

export const TransactionsTab = () => {
  const transactions = useTransactions() as Transaction[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Transaction History</h2>
        <p className="text-muted-foreground mt-2">
          View all your past bundle purchases
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card className="glass border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Receipt className="w-16 h-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                Your purchase history will appear here
              </p>
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
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <TableCell className="font-medium">{transaction.plan}</TableCell>
                      <TableCell>{transaction.duration}</TableCell>
                      <TableCell className="font-semibold gradient-text">
                        KSh {transaction.amount}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary text-primary-foreground">
                          {transaction.status}
                        </Badge>
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
