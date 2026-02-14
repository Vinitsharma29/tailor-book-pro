import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, User, Mail, Phone, Loader2, Pencil, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const Profile: React.FC = () => {
  const { profile, loading, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: "",
    owner_name: "",
    phone_number: "",
  });

  const startEditing = () => {
    if (profile) {
      setFormData({
        shop_name: profile.shop_name,
        owner_name: profile.owner_name,
        phone_number: profile.phone_number,
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        shop_name: formData.shop_name,
        owner_name: formData.owner_name,
        phone_number: formData.phone_number,
      })
      .eq("user_id", profile.user_id);

    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: t("common.success"), description: t("profile.updated") });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  if (!profile) {
    return (<div className="text-center py-20 text-muted-foreground"><p>{t("profile.notFound")}</p></div>);
  }

  const details = [
    { icon: Store, key: "shop_name", label: t("profile.shopName"), value: profile.shop_name },
    { icon: User, key: "owner_name", label: t("profile.ownerName"), value: profile.owner_name },
    { icon: Mail, key: "email", label: t("profile.email"), value: profile.email },
    { icon: Phone, key: "phone_number", label: t("profile.phone"), value: profile.phone_number },
  ];

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">{profile.owner_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.shop_name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>{t("profile.shopName")}</Label>
                  <Input value={formData.shop_name} onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>{t("profile.ownerName")}</Label>
                  <Input value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>{t("profile.phone")}</Label>
                  <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {t("common.save")}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {details.map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <item.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={startEditing} className="w-full mt-2">
                <Pencil className="w-4 h-4 mr-2" />
                {t("profile.editProfile")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
