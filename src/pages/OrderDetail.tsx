import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { orderStatusLabels, orderStatusOrder } from "@/lib/supabase";
import {
  ArrowLeft, Calendar, Phone, User, Ruler, FileText, Check, Loader2, Share2, MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateAndUploadBill, openWhatsAppShare } from "@/lib/bill-generator";
import { useTranslation } from "react-i18next";

interface OrderData {
  id: string;
  order_id: string;
  token_number: number;
  gender: string;
  stitch_category: string;
  measurements: Record<string, string>;
  work_description: string | null;
  due_date: string;
  charges: number | null;
  status: string;
  is_completed: boolean;
  created_at: string;
  customers: {
    name: string;
    phone_number: string;
  };
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [billUrl, setBillUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`id, order_id, token_number, gender, stitch_category, measurements, work_description, due_date, charges, status, is_completed, created_at, customers (name, phone_number)`)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data as OrderData);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({ title: t("common.error"), description: t("orderDetail.errorLoadingOrder"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const isCompleted = newStatus === "completed";
      const validStatus = newStatus as "pattern_cutting" | "assembly" | "sewing_seams" | "finishing" | "completed";
      const { error } = await supabase.from("orders").update({ status: validStatus, is_completed: isCompleted }).eq("id", order.id);
      if (error) throw error;
      setOrder({ ...order, status: validStatus, is_completed: isCompleted });
      toast({ title: t("orderDetail.statusUpdated"), description: t("orderDetail.statusChangedTo", { status: orderStatusLabels[newStatus] }) });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setUpdating(false);
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

  const handleShare = async () => {
    const trackingUrl = `${window.location.origin}/track?id=${order?.order_id}`;
    const message = `Track your order: ${order?.order_id}\n${trackingUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Order ${order?.order_id}`, text: message, url: trackingUrl });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(trackingUrl);
      toast({ title: t("orderDetail.linkCopied"), description: t("orderDetail.trackingLinkCopied") });
    }
  };

  const handleShareOnWhatsApp = async () => {
    if (!order || !profile) return;

    const phone = order.customers?.phone_number;
    if (!phone) {
      toast({ title: t("orderDetail.phoneMissing"), description: t("orderDetail.phoneMissingDesc"), variant: "destructive" });
      return;
    }

    setGeneratingBill(true);
    try {
      let url = billUrl;
      if (!url) {
        url = await generateAndUploadBill({
          orderId: order.order_id,
          tokenNumber: order.token_number,
          customerName: order.customers?.name ?? "Customer",
          customerPhone: phone,
          gender: order.gender,
          stitchCategory: order.stitch_category,
          measurements: order.measurements,
          workDescription: order.work_description,
          dueDate: order.due_date,
          charges: order.charges,
          createdAt: order.created_at,
          shopName: profile.shop_name,
          shopPhone: profile.phone_number,
        });
        setBillUrl(url);
      }

      // Try Web Share API first on mobile, fallback to WhatsApp link
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Bill - ${order.order_id}`,
            text: `Hello ${order.customers?.name ?? "Customer"}, your tailoring bill is ready. Download your bill here: ${url}`,
            url: url,
          });
          toast({ title: t("orderDetail.whatsAppOpened"), description: t("orderDetail.billReadyToSend") });
          return;
        } catch {
          // User cancelled or not supported, fall through to WhatsApp link
        }
      }

      openWhatsAppShare(phone, url, {
        orderId: order.order_id,
        customerName: order.customers?.name ?? "Customer",
        shopName: profile.shop_name,
      });

      toast({ title: t("orderDetail.whatsAppOpened"), description: t("orderDetail.billReadyToSend") });
    } catch (error: any) {
      console.error("Error generating bill:", error);
      toast({ title: t("common.error"), description: error.message || t("orderDetail.billError"), variant: "destructive" });
    } finally {
      setGeneratingBill(false);
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("orderDetail.orderNotFound")}</p>
        <Button variant="outline" onClick={() => navigate("/orders")} className="mt-4">{t("orderDetail.backToOrders")}</Button>
      </div>
    );
  }

  const currentStatusIndex = orderStatusOrder.indexOf(order.status as any);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />{t("common.back")}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShareOnWhatsApp} disabled={generatingBill} className="text-green-600 border-green-300 hover:bg-green-50">
            {generatingBill ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            {t("orderDetail.shareWhatsApp")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />{t("orderDetail.share")}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">Token #{order.token_number}</Badge>
              <h1 className="text-2xl font-display font-bold">{order.order_id}</h1>
              <p className="text-primary-foreground/80 capitalize">{order.gender} • {order.stitch_category.replace(/_/g, " ")}</p>
            </div>
            <Badge className={cn("text-lg py-2 px-4", getStatusColor(order.status, true))}>{orderStatusLabels[order.status]}</Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t("orderDetail.orderProgress")}</h3>
            <div className="flex items-center justify-between">
              {orderStatusOrder.map((status, index) => (
                <React.Fragment key={status}>
                  <button onClick={() => updateStatus(status)} disabled={updating} className={cn("flex flex-col items-center gap-2 p-3 rounded-lg transition-all", index <= currentStatusIndex ? "cursor-pointer hover:bg-muted" : "cursor-pointer opacity-50 hover:opacity-75")}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", index < currentStatusIndex ? "bg-success text-success-foreground" : index === currentStatusIndex ? getStatusColor(status, true) : "bg-muted text-muted-foreground")}>
                      {index < currentStatusIndex ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                    <span className="text-xs text-center text-muted-foreground max-w-[60px]">{orderStatusLabels[status]}</span>
                  </button>
                  {index < orderStatusOrder.length - 1 && <div className={cn("flex-1 h-1 mx-1 rounded", index < currentStatusIndex ? "bg-success" : "bg-muted")} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4" />{t("orderDetail.customerDetails")}</h3>
              <div className="space-y-2 text-sm">
                <p className="text-foreground font-medium">{order.customers?.name ?? "Unknown"}</p>
                <p className="text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3" />{order.customers?.phone_number ?? "N/A"}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />{t("orderDetail.orderDetails")}</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{t("orderDetail.created")}: {format(new Date(order.created_at), "PPP")}</p>
                <p className="text-foreground font-medium">{t("orderDetail.due")}: {format(new Date(order.due_date), "PPP")}</p>
                {order.charges && <p className="text-lg font-bold text-accent">₹{order.charges}</p>}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Ruler className="w-4 h-4" />{t("orderDetail.measurements")}</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(order.measurements).map(([key, value]) => (
                <div key={key} className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{key}</p>
                  <p className="font-semibold text-foreground">{value || "-"}</p>
                </div>
              ))}
            </div>
          </div>

          {order.work_description && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />{t("orderDetail.workDescription")}</h3>
                <p className="text-muted-foreground bg-muted rounded-lg p-4">{order.work_description}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{profile?.shop_name}</p>
            <p>{profile?.phone_number}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
