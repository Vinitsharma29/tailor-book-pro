import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  ListOrdered, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { orderStatusLabels } from "@/lib/supabase";

interface OrderStats {
  total: number;
  active: number;
  completed: number;
  dueSoon: number;
  overdue: number;
}

interface RecentOrder {
  id: string;
  order_id: string;
  stitch_category: string;
  status: string;
  due_date: string;
  customer: {
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    active: 0,
    completed: 0,
    dueSoon: 0,
    overdue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_id,
          stitch_category,
          status,
          due_date,
          is_completed,
          customers (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const today = new Date();
      const threeDaysFromNow = addDays(today, 3);

      const orderStats: OrderStats = {
        total: orders?.length || 0,
        active: orders?.filter((o) => !o.is_completed).length || 0,
        completed: orders?.filter((o) => o.is_completed).length || 0,
        dueSoon: orders?.filter((o) => {
          const dueDate = new Date(o.due_date);
          return !o.is_completed && isAfter(dueDate, today) && isBefore(dueDate, threeDaysFromNow);
        }).length || 0,
        overdue: orders?.filter((o) => {
          const dueDate = new Date(o.due_date);
          return !o.is_completed && isBefore(dueDate, today);
        }).length || 0,
      };

      setStats(orderStats);
      setRecentOrders(
        (orders?.slice(0, 5) || []).map((o) => ({
          id: o.id,
          order_id: o.order_id,
          stitch_category: o.stitch_category,
          status: o.status,
          due_date: o.due_date,
          customer: { name: (o.customers as any)?.name || "Unknown" },
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pattern_cutting: "bg-status-pattern",
      assembly: "bg-status-assembly",
      sewing_seams: "bg-status-sewing",
      finishing: "bg-status-finishing",
      completed: "bg-status-completed",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Welcome, {profile?.owner_name}!
        </h1>
        <p className="text-primary-foreground/80">{profile?.shop_name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/new-order">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-accent hover:border-accent/80">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <PlusCircle className="w-6 h-6 text-accent" />
              </div>
              <span className="font-semibold text-foreground">New Order</span>
              <span className="text-sm text-muted-foreground">Add customer & measurements</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ListOrdered className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-foreground">All Orders</span>
              <span className="text-sm text-muted-foreground">View & manage orders</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-warning">{stats.dueSoon}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display">Recent Orders</CardTitle>
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
              <Link to="/new-order">
                <Button className="mt-4" variant="outline">
                  Create your first order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{order.customer.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {order.order_id}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {order.stitch_category.replace(/_/g, " ")} • Due {format(new Date(order.due_date), "MMM d")}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-primary-foreground`}>
                    {orderStatusLabels[order.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
