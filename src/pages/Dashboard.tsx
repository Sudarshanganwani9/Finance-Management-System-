import OverviewCards from "@/components/dashboard/OverviewCards"
import SpendingChart from "@/components/dashboard/SpendingChart"
import TransactionList from "@/components/transactions/TransactionList"
import BudgetProgress from "@/components/budget/BudgetProgress"

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your financial overview.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <OverviewCards />

      {/* Charts and Analysis */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SpendingChart />
        
        <div className="space-y-6">
          <TransactionList />
          <BudgetProgress />
        </div>
      </div>
    </div>
  )
}

export default Dashboard