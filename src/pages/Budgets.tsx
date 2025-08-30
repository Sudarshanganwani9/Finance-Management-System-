import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import BudgetForm from '@/components/budget/BudgetForm'
import BudgetProgress from '@/components/budget/BudgetProgress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, DollarSign } from 'lucide-react'

const Budgets = () => {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['all-budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const { data: transactions } = useQuery({
    queryKey: ['budget-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
      
      if (error) throw error
      return data
    }
  })

  const calculateBudgetStats = (budget: any) => {
    if (!transactions) return { spent: 0, percentage: 0, remaining: 0 }
    
    const spent = transactions
      .filter(t => budget.category_id ? t.category_id === budget.category_id : true)
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const budgetAmount = Number(budget.amount)
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
    const remaining = budgetAmount - spent
    
    return { spent, percentage, remaining }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Set and track your spending limits
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'View Budgets' : 'Create Budget'}
        </Button>
      </div>

      {showForm ? (
        <div className="grid gap-6 md:grid-cols-2">
          <BudgetForm onSuccess={() => setShowForm(false)} />
          <BudgetProgress />
        </div>
      ) : (
        <>
          {/* Budget Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{budgets?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active budgets</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all budgets</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgets && budgets.length > 0 
                    ? Math.round(budgets.reduce((sum, budget) => {
                        const { percentage } = calculateBudgetStats(budget)
                        return sum + percentage
                      }, 0) / budgets.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Across all budgets</p>
              </CardContent>
            </Card>
          </div>

          {/* Budget List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Budgets</CardTitle>
              <CardDescription>
                Track your spending against your budget goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {budgets?.map((budget) => {
                    const { spent, percentage, remaining } = calculateBudgetStats(budget)
                    
                    return (
                      <div key={budget.id} className="p-6 rounded-lg bg-muted/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{budget.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(budget.start_date)} - {budget.end_date ? formatDate(budget.end_date) : 'Ongoing'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={percentage >= 90 ? "destructive" : percentage >= 70 ? "secondary" : "default"}
                              className="mb-2"
                            >
                              {budget.period}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(spent)} of {formatCurrency(Number(budget.amount))}
                            </p>
                          </div>
                        </div>
                        
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="h-3"
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span className={remaining >= 0 ? "text-success" : "text-destructive"}>
                            {remaining >= 0 ? "Remaining: " : "Over budget: "}
                            {formatCurrency(Math.abs(remaining))}
                          </span>
                          <span className="text-muted-foreground">
                            {percentage.toFixed(1)}% used
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default Budgets