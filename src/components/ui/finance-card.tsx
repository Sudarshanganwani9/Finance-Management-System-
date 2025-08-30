import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const financeCardVariants = cva(
  "relative overflow-hidden transition-all duration-300 hover:shadow-glow",
  {
    variants: {
      variant: {
        default: "bg-gradient-card shadow-card",
        income: "bg-gradient-success shadow-card border-success/20",
        expense: "bg-card shadow-card border-destructive/20",
        budget: "bg-gradient-primary shadow-card border-primary/20",
        overview: "bg-gradient-card shadow-card border-primary/10"
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

interface FinanceCardProps extends VariantProps<typeof financeCardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  children?: React.ReactNode
}

const FinanceCard = React.forwardRef<HTMLDivElement, FinanceCardProps>(
  ({ className, variant, size, title, value, description, icon, trend, trendValue, children, ...props }, ref) => {
    const getTrendColor = () => {
      if (trend === "up") return "text-success"
      if (trend === "down") return "text-destructive"
      return "text-muted-foreground"
    }

    const getTrendIcon = () => {
      if (trend === "up") return "↗"
      if (trend === "down") return "↘"
      return "→"
    }

    return (
      <Card 
        ref={ref} 
        className={cn(financeCardVariants({ variant, size }), className)} 
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {description}
            </CardDescription>
          )}
          {trend && trendValue && (
            <p className={cn("text-xs flex items-center mt-2", getTrendColor())}>
              <span className="mr-1">{getTrendIcon()}</span>
              {trendValue}
            </p>
          )}
          {children}
        </CardContent>
      </Card>
    )
  }
)

FinanceCard.displayName = "FinanceCard"

export { FinanceCard, financeCardVariants }