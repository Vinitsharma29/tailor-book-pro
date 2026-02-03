import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Default measurement fields for each category
export const defaultMeasurementFields: Record<string, Record<string, string[]>> = {
  women: {
    blouse: ["Chest", "Waist", "Hip", "Height", "Length", "Shoulder", "Sleeve Length", "Armhole", "Neck"],
    dress: ["Chest", "Waist", "Hip", "Length", "Shoulder", "Sleeve Length", "Armhole", "Neck"],
    top: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length"],
    kurti: ["Chest", "Waist", "Hip", "Length", "Shoulder", "Sleeve Length", "Slit Length"],
    lehenga: ["Waist", "Hip", "Length", "Flare"],
    saree_blouse: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length", "Back Neck Depth", "Front Neck Depth"],
    salwar: ["Waist", "Hip", "Length", "Bottom", "Thigh"],
    churidar: ["Waist", "Hip", "Length", "Knee", "Bottom", "Thigh"],
  },
  men: {
    shirt: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length", "Collar", "Armhole"],
    pant: ["Waist", "Hip", "Length", "Inseam", "Thigh", "Knee", "Bottom"],
    kurta: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length", "Collar"],
    coat: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length", "Back Length"],
    blazer: ["Chest", "Waist", "Length", "Shoulder", "Sleeve Length"],
    sherwani: ["Chest", "Waist", "Hip", "Length", "Shoulder", "Sleeve Length", "Collar"],
    waistcoat: ["Chest", "Waist", "Length"],
  },
};

export const orderStatusLabels: Record<string, string> = {
  pattern_cutting: "Pattern Cutting",
  assembly: "Assembly",
  sewing_seams: "Sewing Seams",
  finishing: "Finishing",
  completed: "Completed",
};

export const orderStatusOrder = [
  "pattern_cutting",
  "assembly",
  "sewing_seams",
  "finishing",
  "completed",
] as const;
