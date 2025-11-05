import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  normalBalance: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
}

interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: string;
  referenceType?: string;
  referenceId?: number;
  ledgerEntries?: LedgerEntry[];
}

interface LedgerEntry {
  id: number;
  accountId: number;
  debit: string;
  credit: string;
  description?: string;
}

const AccountingSection = () => {
  const [activeTab, setActiveTab] = useState("chart-of-accounts");
  const [searchTerm, setSearchTerm] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "asset",
    subtype: "",
    normalBalance: "debit",
    description: "",
  });

  const [journalEntryData, setJournalEntryData] = useState({
    description: "",
    notes: "",
    entries: [
      { accountId: 0, debit: "0.00", credit: "0.00", description: "" },
      { accountId: 0, debit: "0.00", credit: "0.00", description: "" },
    ],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounting/accounts", accountType],
    queryFn: async () => {
      const url = accountType === "all" 
        ? "/api/accounting/accounts" 
        : `/api/accounting/accounts?type=${accountType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return response.json();
    },
  });

  const { data: journalEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/accounting/journal-entries"],
    queryFn: async () => {
      const response = await fetch("/api/accounting/journal-entries");
      if (!response.ok) throw new Error("Failed to fetch journal entries");
      return response.json();
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/accounting/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create account");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/accounts"] });
      setIsAccountDialogOpen(false);
      setNewAccount({
        code: "",
        name: "",
        type: "asset",
        subtype: "",
        normalBalance: "debit",
        description: "",
      });
      toast({
        title: "Account created",
        description: "The account has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account.",
        variant: "destructive",
      });
    },
  });

  const createJournalEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/accounting/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: 1,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create journal entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/reports"] });
      setIsJournalDialogOpen(false);
      setJournalEntryData({
        description: "",
        notes: "",
        entries: [
          { accountId: 0, debit: "0.00", credit: "0.00", description: "" },
          { accountId: 0, debit: "0.00", credit: "0.00", description: "" },
        ],
      });
      toast({
        title: "Journal entry created",
        description: "The journal entry has been successfully posted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry.",
        variant: "destructive",
      });
    },
  });

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      asset: "bg-blue-100 text-blue-800",
      liability: "bg-red-100 text-red-800",
      equity: "bg-purple-100 text-purple-800",
      revenue: "bg-green-100 text-green-800",
      expense: "bg-orange-100 text-orange-800",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  const formatCurrency = (amount: string) => {
    return `KSH ${parseFloat(amount).toFixed(2)}`;
  };

  const calculateTotals = () => {
    const debits = journalEntryData.entries.reduce((sum, entry) => sum + parseFloat(entry.debit || "0"), 0);
    const credits = journalEntryData.entries.reduce((sum, entry) => sum + parseFloat(entry.credit || "0"), 0);
    return { debits, credits, difference: debits - credits };
  };

  const addJournalEntryLine = () => {
    setJournalEntryData({
      ...journalEntryData,
      entries: [
        ...journalEntryData.entries,
        { accountId: 0, debit: "0.00", credit: "0.00", description: "" },
      ],
    });
  };

  const updateJournalEntryLine = (index: number, field: string, value: any) => {
    const newEntries = [...journalEntryData.entries];
    (newEntries[index] as any)[field] = value;
    setJournalEntryData({ ...journalEntryData, entries: newEntries });
  };

  const removeJournalEntryLine = (index: number) => {
    if (journalEntryData.entries.length > 2) {
      const newEntries = journalEntryData.entries.filter((_, i) => i !== index);
      setJournalEntryData({ ...journalEntryData, entries: newEntries });
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Accounting Module</h2>
          <p className="text-muted-foreground">Manage chart of accounts and journal entries</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="chart-of-accounts" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="liability">Liabilities</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Account</DialogTitle>
                  <DialogDescription>Add a new account to the chart of accounts</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Code</Label>
                      <Input
                        value={newAccount.code}
                        onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={newAccount.type}
                        onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="e.g., Cash in Hand"
                    />
                  </div>
                  <div>
                    <Label>Normal Balance</Label>
                    <Select
                      value={newAccount.normalBalance}
                      onValueChange={(value) => setNewAccount({ ...newAccount, normalBalance: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newAccount.description}
                      onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => createAccountMutation.mutate(newAccount)}>
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Normal Balance</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                        <TableCell className="capitalize">{account.normalBalance}</TableCell>
                        <TableCell>
                          {account.isSystem ? (
                            <Badge variant="secondary">System</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal-entries" className="space-y-4">
          <div className="flex justify-between items-center">
            <div></div>
            <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Journal Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Journal Entry</DialogTitle>
                  <DialogDescription>
                    Enter debits and credits. Totals must balance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={journalEntryData.description}
                      onChange={(e) =>
                        setJournalEntryData({ ...journalEntryData, description: e.target.value })
                      }
                      placeholder="e.g., Record monthly rent expense"
                    />
                  </div>
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={journalEntryData.notes}
                      onChange={(e) =>
                        setJournalEntryData({ ...journalEntryData, notes: e.target.value })
                      }
                      placeholder="Additional notes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Journal Entry Lines</Label>
                    {journalEntryData.entries.map((entry, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Select
                            value={entry.accountId.toString()}
                            onValueChange={(value) =>
                              updateJournalEntryLine(index, "accountId", parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.debit}
                            onChange={(e) => updateJournalEntryLine(index, "debit", e.target.value)}
                            placeholder="Debit"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.credit}
                            onChange={(e) => updateJournalEntryLine(index, "credit", e.target.value)}
                            placeholder="Credit"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeJournalEntryLine(index)}
                            disabled={journalEntryData.entries.length <= 2}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addJournalEntryLine}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Line
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Debits:</span>
                          <span className="font-semibold">{formatCurrency(totals.debits.toString())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Credits:</span>
                          <span className="font-semibold">{formatCurrency(totals.credits.toString())}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-bold">Difference:</span>
                          <span className={`font-bold ${Math.abs(totals.difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totals.difference.toString())}
                          </span>
                        </div>
                        {Math.abs(totals.difference) >= 0.01 && (
                          <p className="text-sm text-red-600">
                            Entry not balanced. Debits must equal credits.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsJournalDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createJournalEntryMutation.mutate(journalEntryData)}
                    disabled={Math.abs(totals.difference) >= 0.01}
                  >
                    Post Entry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Journal Entries ({journalEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No journal entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    journalEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                        <TableCell>{format(new Date(entry.entryDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          {entry.referenceType && (
                            <Badge variant="outline">
                              {entry.referenceType} #{entry.referenceId}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={entry.status === "posted" ? "bg-green-100 text-green-800" : ""}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingSection;
