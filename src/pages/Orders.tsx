import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, User, Loader2 } from "lucide-react";
import { format, isBefore } from "date-fns";
import { orderStatusLabels } from "@/lib/supabase";

interface Order {
  id: string;
  order_id: string;
  gender: string;
  stitch_category: string;
  status: string;
  due_date: string;
  charges: number | null;
  is_completed: boolean;
  created_at: string;
  customers: {
    name: string;
    phone_number: string;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_id,
          gender,
          stitch_category,
          status,
          due_date,
          charges,
          is_completed,
          created_at,
          customers (name, phone_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as Order[] || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  const isOverdue = (dueDate: string, isCompleted: boolean) => {
    return !isCompleted && isBefore(new Date(dueDate), new Date());
  };

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customers?.name ?? "";
    const customerPhone = order.customers?.phone_number ?? "";
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerPhone.includes(searchQuery) ||
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && !order.is_completed) ||
      (activeTab === "completed" && order.is_completed);

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">All Orders</h1>
          <p className="text-muted-foreground">Manage and track your orders</p>
        </div>
        <Link to="/new-order">
          <Button className="bg-gradient-primary">+ New Order</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({orders.filter((o) => !o.is_completed).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({orders.filter((o) => o.is_completed).length})</TabsTrigger>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{order.customers?.name ?? "Unknown"}</span>
                            <Badge variant="outline" className="text-xs">
                              {order.order_id}
                            </Badge>
                            {isOverdue(order.due_date, order.is_completed) && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="capitalize">{order.stitch_category.replace(/_/g, " ")}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {format(new Date(order.due_date), "MMM d, yyyy")}
                            </span>
                            {order.charges && (
                              <span className="font-medium text-foreground">₹{order.charges}</span>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-primary-foreground`}>
                          {orderStatusLabels[order.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
