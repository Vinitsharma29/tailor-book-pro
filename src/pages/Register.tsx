import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Mail, Lock, User, Phone, Store, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    shopName: "", ownerName: "", phone: "", email: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: t("register.passwordMismatch"), description: t("register.passwordMismatchDesc"), variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: t("register.weakPassword"), description: t("register.weakPasswordDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, formData.shopName, formData.ownerName, formData.phone);
    if (error) {
      const isRateLimit = error.message?.toLowerCase().includes("rate limit") || error.message?.toLowerCase().includes("429");
      if (isRateLimit) {
        setCooldown(60);
        toast({ title: t("register.tooManyAttempts"), description: t("register.waitBeforeRetry"), variant: "destructive" });
      } else {
        toast({ title: t("register.registrationFailed"), description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: t("register.registrationSuccess"), description: t("register.checkEmail") });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-foreground/10 mb-3">
            <Scissors className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary-foreground">{t("common.appName")}</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-display">{t("register.title")}</CardTitle>
            <CardDescription>{t("register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">{t("register.shopName")}</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="shopName" name="shopName" placeholder={t("register.shopNamePlaceholder")} value={formData.shopName} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">{t("register.ownerName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="ownerName" name="ownerName" placeholder={t("register.ownerNamePlaceholder")} value={formData.ownerName} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("register.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" name="phone" type="tel" placeholder={t("register.phonePlaceholder")} value={formData.phone} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("register.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder={t("register.emailPlaceholder")} value={formData.email} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("register.confirm")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading || cooldown > 0}>
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("register.creatingAccount")}</>) : cooldown > 0 ? (t("register.waitRetry", { seconds: cooldown })) : (t("register.createAccount"))}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t("register.hasAccount")} </span>
              <Link to="/login" className="text-primary font-medium hover:underline">{t("register.signIn")}</Link>
            </div>

            <div className="mt-4 flex justify-center">
              <LanguageSelector variant="dark" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
