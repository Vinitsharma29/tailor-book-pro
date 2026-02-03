import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { defaultMeasurementFields } from "@/lib/supabase";
import { 
  ChevronRight, 
  ChevronLeft, 
  CalendarIcon, 
  User, 
  Phone,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Gender = "men" | "women";

interface OrderFormData {
  gender: Gender | null;
  category: string;
  measurements: Record<string, string>;
  customerName: string;
  customerPhone: string;
  workDescription: string;
  dueDate: Date | undefined;
  charges: string;
}

const NewOrder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    gender: null,
    category: "",
    measurements: {},
    customerName: "",
    customerPhone: "",
    workDescription: "",
    dueDate: undefined,
    charges: "",
  });

  const categories = formData.gender ? Object.keys(defaultMeasurementFields[formData.gender]) : [];
  const measurementFields = formData.gender && formData.category 
    ? defaultMeasurementFields[formData.gender][formData.category] || []
    : [];

  const handleGenderSelect = (gender: Gender) => {
    setFormData({ ...formData, gender, category: "", measurements: {} });
  };

  const handleCategorySelect = (category: string) => {
    const fields = defaultMeasurementFields[formData.gender!][category] || [];
    const initialMeasurements: Record<string, string> = {};
    fields.forEach((field) => (initialMeasurements[field] = ""));
    setFormData({ ...formData, category, measurements: initialMeasurements });
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      measurements: { ...formData.measurements, [field]: value },
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Create or find customer
      let customerId: string;

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("tailor_id", user.id)
        .eq("phone_number", formData.customerPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            tailor_id: user.id,
            name: formData.customerName,
            phone_number: formData.customerPhone,
          })
          .select("id")
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          tailor_id: user.id,
          customer_id: customerId,
          gender: formData.gender,
          stitch_category: formData.category,
          measurements: formData.measurements,
          work_description: formData.workDescription,
          due_date: formData.dueDate?.toISOString().split("T")[0],
          charges: formData.charges ? parseFloat(formData.charges) : null,
        })
        .select("id, order_id, token_number")
        .single();

      if (orderError) throw orderError;

      toast({
        title: "Order Created Successfully!",
        description: `Order ID: ${order.order_id} | Token: #${order.token_number}`,
      });

      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.gender !== null;
      case 2:
        return formData.category !== "";
      case 3:
        return Object.values(formData.measurements).some((v) => v !== "");
      case 4:
        return (
          formData.customerName.trim() !== "" &&
          formData.customerPhone.trim() !== "" &&
          formData.dueDate !== undefined
        );
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">Select Gender</h2>
              <p className="text-muted-foreground">Choose the customer's gender</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(["men", "women"] as Gender[]).map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleGenderSelect(gender)}
                  className={cn(
                    "p-8 rounded-xl border-2 transition-all text-center",
                    formData.gender === gender
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="text-4xl mb-3">{gender === "men" ? "👔" : "👗"}</div>
                  <span className="font-semibold text-lg capitalize text-foreground">{gender}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">Select Category</h2>
              <p className="text-muted-foreground">What type of garment?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center capitalize",
                    formData.category === category
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="font-medium text-foreground">{category.replace(/_/g, " ")}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">Enter Measurements</h2>
              <p className="text-muted-foreground">
                {formData.category.replace(/_/g, " ")} measurements (in inches)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {measurementFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="text-sm font-medium">{field}</Label>
                  <Input
                    id={field}
                    type="number"
                    step="0.25"
                    placeholder="0.00"
                    value={formData.measurements[field] || ""}
                    onChange={(e) => handleMeasurementChange(field, e.target.value)}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">Customer Details</h2>
              <p className="text-muted-foreground">Enter job information</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="customerName"
                    placeholder="Customer name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workDescription">Work Description (Optional)</Label>
                <Textarea
                  id="workDescription"
                  placeholder="Any special instructions or notes..."
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, "PP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charges">Charges (₹)</Label>
                  <Input
                    id="charges"
                    type="number"
                    placeholder="0.00"
                    value={formData.charges}
                    onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                s < step
                  ? "bg-success text-success-foreground"
                  : s === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div
                className={cn(
                  "w-12 h-1 mx-1 rounded transition-all",
                  s < step ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-primary"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="bg-gradient-accent shadow-accent"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrder;
