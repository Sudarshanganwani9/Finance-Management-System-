import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(240, 3%, 15%)']

const SpendingChart = () => {
  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          transaction_categories (
            name,
            color
          )
        `)
        .order("transaction_date", { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Process data for charts
  const monthlyData = transactions?.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, income: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      acc[monthKey].income += Number(transaction.amount)
    } else {
      acc[monthKey].expenses += Number(transaction.amount)
    }
    
    return acc
  }, {} as Record<string, any>)

  const barChartData = Object.values(monthlyData || {}).slice(-6)

  const categoryData = transactions?.reduce((acc, transaction) => {
    if (transaction.type === 'expense') {
      const categoryName = transaction.transaction_categories?.name || 'Other'
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0 }
      }
      acc[categoryName].value += Number(transaction.amount)
    }
    return acc
  }, {} as Record<string, any>)

  const pieChartData = Object.values(categoryData || {})

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Spending Analytics</CardTitle>
        <CardDescription>Your financial overview and category breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Monthly Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
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
                <Bar dataKey="income" fill="hsl(var(--income))" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--expense))" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default SpendingChart