import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinanceCard } from '@/components/ui/finance-card'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(240, 3%, 15%)']

const Analytics = () => {
  const { user } = useAuth()

  const { data: transactions } = useQuery({
    queryKey: ['analytics-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_categories (
            name,
            color
          )
        `)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Process data for analytics
  const processDataForAnalytics = () => {
    if (!transactions) return { monthlyData: [], categoryData: [], trendData: [] }

    // Monthly data
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transaction_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, income: 0, expenses: 0, net: 0 }
      }
      
      if (transaction.type === 'income') {
        acc[monthKey].income += Number(transaction.amount)
      } else {
        acc[monthKey].expenses += Number(transaction.amount)
      }
      
      acc[monthKey].net = acc[monthKey].income - acc[monthKey].expenses
      
      return acc
    }, {} as Record<string, any>)

    // Category data for expenses
    const categoryData = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const categoryName = transaction.transaction_categories?.name || 'Other'
        if (!acc[categoryName]) {
          acc[categoryName] = { name: categoryName, value: 0, count: 0 }
        }
        acc[categoryName].value += Number(transaction.amount)
        acc[categoryName].count += 1
        return acc
      }, {} as Record<string, any>)

    // Trend data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const trendData = transactions
      .filter(t => new Date(t.transaction_date) >= thirtyDaysAgo)
      .reduce((acc, transaction) => {
        const date = transaction.transaction_date
        if (!acc[date]) {
          acc[date] = { date, income: 0, expenses: 0, balance: 0 }
        }
        
        if (transaction.type === 'income') {
          acc[date].income += Number(transaction.amount)
        } else {
          acc[date].expenses += Number(transaction.amount)
        }
        
        return acc
      }, {} as Record<string, any>)

    // Calculate running balance
    const sortedTrendData = Object.values(trendData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    let runningBalance = 0
    sortedTrendData.forEach((day: any) => {
      runningBalance += day.income - day.expenses
      day.balance = runningBalance
    })

    return {
      monthlyData: Object.values(monthlyData).slice(-6),
      categoryData: Object.values(categoryData),
      trendData: sortedTrendData.slice(-14) // Last 14 days
    }
  }

  const { monthlyData, categoryData, trendData } = processDataForAnalytics()

  // Calculate summary stats
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const netWorth = totalIncome - totalExpenses
  const avgMonthlyIncome = monthlyData.length > 0 ? monthlyData.reduce((sum: number, month: any) => sum + month.income, 0) / monthlyData.length : 0
  const avgMonthlyExpenses = monthlyData.length > 0 ? monthlyData.reduce((sum: number, month: any) => sum + month.expenses, 0) / monthlyData.length : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Deep insights into your financial patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FinanceCard
          variant="overview"
          title="Net Worth"
          value={formatCurrency(netWorth)}
          description="Total income - expenses"
          icon={<DollarSign />}
          trend={netWorth >= 0 ? "up" : "down"}
          trendValue={netWorth >= 0 ? "Positive" : "Negative"}
        />
        
        <FinanceCard
          variant="income"
          title="Avg Monthly Income"
          value={formatCurrency(avgMonthlyIncome)}
          description="Average per month"
          icon={<TrendingUp />}
          trend="up"
          trendValue="Income trend"
        />
        
        <FinanceCard
          variant="expense"
          title="Avg Monthly Expenses"
          value={formatCurrency(avgMonthlyExpenses)}
          description="Average per month"
          icon={<TrendingDown />}
          trend="neutral"
          trendValue="Expense trend"
        />
        
        <FinanceCard
          variant="budget"
          title="Savings Rate"
          value={`${totalIncome > 0 ? ((netWorth / totalIncome) * 100).toFixed(1) : 0}%`}
          description="Money saved vs earned"
          icon={<Calendar />}
          trend={netWorth > 0 ? "up" : "down"}
          trendValue="Savings performance"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area dataKey="income" stackId="1" stroke="hsl(var(--income))" fill="hsl(var(--income))" fillOpacity={0.6} />
                  <Area dataKey="expenses" stackId="2" stroke="hsl(var(--expense))" fill="hsl(var(--expense))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Net Income</CardTitle>
              <CardDescription>Income minus expenses by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Net Income']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="net" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown of spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Balance Trend</CardTitle>
              <CardDescription>Running balance over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Balance']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics