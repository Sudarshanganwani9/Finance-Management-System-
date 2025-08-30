import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const BudgetProgress = () => {
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const { data: transactions } = useQuery({
    queryKey: ["transactions-for-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
      
      if (error) throw error
      return data
    }
  })

  const calculateSpent = (budgetId: string, categoryId?: string) => {
    if (!transactions) return 0
    
    return transactions
      .filter(t => categoryId ? t.category_id === categoryId : true)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive"
    if (percentage >= 70) return "bg-warning"
    return "bg-success"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending against budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>Track your spending against budgets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets?.map((budget) => {
            const spent = calculateSpent(budget.id, budget.category_id)
            const budgetAmount = Number(budget.amount)
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
            const remaining = budgetAmount - spent

            return (
              <div key={budget.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{budget.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(spent)} of {formatCurrency(budgetAmount)}
                    </p>
                  </div>
                  <Badge 
                    variant={percentage >= 90 ? "destructive" : percentage >= 70 ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
                
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs">
                  <span className={remaining >= 0 ? "text-success" : "text-destructive"}>
                    {remaining >= 0 ? "Remaining: " : "Over budget: "}
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                  <span className="text-muted-foreground">
                    {budget.period}
                  </span>
                </div>
              </div>
            )
          })}
          
          {(!budgets || budgets.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              No budgets found. Create your first budget to start tracking!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default BudgetProgress