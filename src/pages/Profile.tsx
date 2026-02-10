import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, User, Mail, Phone, Loader2 } from "lucide-react";

const Profile: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Profile not found. Please try logging in again.</p>
      </div>
    );
  }

  const details = [
    { icon: Store, label: "Shop Name", value: profile.shop_name },
    { icon: User, label: "Owner Name", value: profile.owner_name },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone_number },
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
          {details.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <item.icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value || "—"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
