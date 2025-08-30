import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { FinanceCard } from "@/components/ui/finance-card"
import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react"

const OverviewCards = () => {
  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const { data: budgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
      
      if (error) throw error
      return data
    }
  })

  // Calculate totals
  const totalIncome = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalExpenses = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const balance = totalIncome - totalExpenses
  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <FinanceCard
        variant="overview"
        title="Balance"
        value={formatCurrency(balance)}
        description="Current balance"
        icon={<Wallet />}
        trend={balance >= 0 ? "up" : "down"}
        trendValue={balance >= 0 ? "Positive" : "Negative"}
      />
      
      <FinanceCard
        variant="income"
        title="Total Income"
        value={formatCurrency(totalIncome)}
        description="This month"
        icon={<TrendingUp />}
        trend="up"
        trendValue="+12% from last month"
      />
      
      <FinanceCard
        variant="expense"
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        description="This month"
        icon={<TrendingDown />}
        trend="down"
        trendValue="-5% from last month"
      />
      
      <FinanceCard
        variant="budget"
        title="Total Budget"
        value={formatCurrency(totalBudget)}
        description="Allocated budget"
        icon={<Target />}
        trend="neutral"
        trendValue="On track"
      />
    </div>
  )
}

export default OverviewCards