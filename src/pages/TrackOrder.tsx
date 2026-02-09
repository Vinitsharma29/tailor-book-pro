import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { orderStatusLabels, orderStatusOrder } from "@/lib/supabase";
import {
  Search,
  Scissors,
  Calendar,
  Check,
  Loader2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TrackingData {
  order_id: string;
  stitch_category: string;
  gender: string;
  status: string;
  due_date: string;
  is_completed: boolean;
  tailor_id: string;
}

interface TailorProfile {
  shop_name: string;
  phone_number: string;
}

const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [tailorProfile, setTailorProfile] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setOrderId(id);
      handleSearch(id);
    }
  }, [searchParams]);

  const handleSearch = async (id?: string) => {
    const searchId = id || orderId;
    if (!searchId.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: queryError } = await supabase
        .from("orders")
        .select("order_id, stitch_category, gender, status, due_date, is_completed, tailor_id")
        .eq("order_id", searchId.toUpperCase())
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError("Order not found. Please check your Order ID and try again.");
        setTrackingData(null);
        setTailorProfile(null);
      } else {
        setTrackingData(data as any);
        // Fetch tailor profile separately
        const { data: profile } = await supabase
          .from("profiles")
          .select("shop_name, phone_number")
          .eq("user_id", data.tailor_id)
          .maybeSingle();
        setTailorProfile(profile);
      }
    } catch (err: any) {
      console.error("Error tracking order:", err);
      setError("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return "bg-muted text-muted-foreground";
    const colors: Record<string, string> = {
      pattern_cutting: "bg-status-pattern text-primary-foreground",
      assembly: "bg-status-assembly text-primary-foreground",
      sewing_seams: "bg-status-sewing text-primary-foreground",
      finishing: "bg-status-finishing text-primary-foreground",
      completed: "bg-status-completed text-primary-foreground",
    };
    return colors[status] || "bg-muted";
  };

  const currentStatusIndex = trackingData
    ? orderStatusOrder.indexOf(trackingData.status as any)
    : -1;

  return (
    <div className="min-h-screen bg-gradient-hero p-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary-foreground">
            Track Your Order
          </h1>
          <p className="text-primary-foreground/70 mt-2">
            Enter your Order ID to see the current status
          </p>
        </div>

        {/* Search Card */}
        <Card className="shadow-xl animate-scale-in">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Order ID (e.g., TB2502030001)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 uppercase"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !orderId.trim()}
                className="bg-gradient-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="animate-slide-up">
            {error ? (
              <Card className="border-destructive/50">
                <CardContent className="flex items-center gap-3 p-6">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            ) : trackingData ? (
              <Card className="overflow-hidden shadow-xl">
                <div className="bg-gradient-primary p-6 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/70 text-sm">Order ID</p>
                      <h2 className="text-2xl font-display font-bold">
                        {trackingData.order_id}
                      </h2>
                      <p className="text-primary-foreground/80 capitalize mt-1">
                        {trackingData.gender} • {trackingData.stitch_category.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-lg py-2 px-4",
                        getStatusColor(trackingData.status, true)
                      )}
                    >
                      {orderStatusLabels[trackingData.status]}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Status Tracker */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Order Progress</h3>
                    <div className="space-y-3">
                      {orderStatusOrder.map((status, index) => (
                        <div
                          key={status}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg transition-all",
                            index <= currentStatusIndex ? "bg-muted" : "opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              index < currentStatusIndex
                                ? "bg-success text-success-foreground"
                                : index === currentStatusIndex
                                ? getStatusColor(status, true)
                                : "bg-border text-muted-foreground"
                            )}
                          >
                            {index <= currentStatusIndex ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-medium",
                                index <= currentStatusIndex
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {orderStatusLabels[status]}
                            </p>
                          </div>
                          {index === currentStatusIndex && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Due Date */}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Delivery</p>
                      <p className="font-semibold text-foreground">
                        {format(new Date(trackingData.due_date), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Shop Contact */}
                  <div className="bg-muted rounded-lg p-4">
                    <p className="font-semibold text-foreground">
                      {tailorProfile?.shop_name}
                    </p>
                    <a
                      href={`tel:${tailorProfile?.phone_number}`}
                      className="flex items-center gap-2 text-primary hover:underline mt-1"
                    >
                      <Phone className="w-4 h-4" />
                      {tailorProfile?.phone_number}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-primary-foreground/80 hover:text-primary-foreground text-sm underline"
          >
            Are you a tailor? Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
