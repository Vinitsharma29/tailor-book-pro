import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

interface BillData {
  orderId: string;
  tokenNumber: number;
  customerName: string;
  customerPhone: string;
  gender: string;
  stitchCategory: string;
  measurements: Record<string, string>;
  workDescription: string | null;
  dueDate: string;
  charges: number | null;
  createdAt: string;
  shopName: string;
  shopPhone: string;
}

export async function generateAndUploadBill(data: BillData): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header - Shop Name
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.shopName || "Tailor Shop", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.shopPhone || "", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  // Bill Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAILORING BILL", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Order Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Order ID:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.orderId, leftCol + 30, y);

  doc.setFont("helvetica", "bold");
  doc.text("Token:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`#${data.tokenNumber}`, rightCol + 25, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Date:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(data.createdAt).toLocaleDateString("en-IN"), leftCol + 30, y);

  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(data.dueDate).toLocaleDateString("en-IN"), rightCol + 25, y);
  y += 12;

  // Customer Info
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Details", leftCol, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Name:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, leftCol + 30, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Phone:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerPhone, leftCol + 30, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Category:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.gender} - ${data.stitchCategory.replace(/_/g, " ")}`, leftCol + 30, y);
  y += 12;

  // Measurements
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Measurements (inches)", leftCol, y);
  y += 8;

  doc.setFontSize(10);
  const entries = Object.entries(data.measurements).filter(([, v]) => v);
  const midPoint = Math.ceil(entries.length / 2);

  entries.forEach(([key, value], index) => {
    const col = index < midPoint ? leftCol : rightCol;
    const row = index < midPoint ? index : index - midPoint;
    const rowY = y + row * 7;

    doc.setFont("helvetica", "bold");
    doc.text(`${key}:`, col, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), col + 40, rowY);
  });

  y += Math.ceil(entries.length / 2) * 7 + 8;

  // Work Description
  if (data.workDescription) {
    doc.setLineWidth(0.3);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Work Description", leftCol, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(data.workDescription, pageWidth - 40);
    doc.text(splitText, leftCol, y);
    y += splitText.length * 6 + 8;
  }

  // Charges
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  if (data.charges) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Charges: ₹${data.charges}`, pageWidth / 2, y, { align: "center" });
    y += 12;
  }

  // Footer
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing us!", pageWidth / 2, y, { align: "center" });

  // Upload to storage
  const pdfBlob = doc.output("blob");
  const fileName = `${data.orderId}.pdf`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("bills")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("bills")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export function openWhatsAppShare(phoneNumber: string, billUrl: string, orderDetails: { orderId: string; customerName: string; shopName: string }) {
  // Clean phone number - remove spaces, dashes, etc.
  let cleanPhone = phoneNumber.replace(/[\s\-()]/g, "");
  
  // Ensure it starts with country code (default to India +91)
  if (!cleanPhone.startsWith("+")) {
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "91" + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("91")) {
      cleanPhone = "91" + cleanPhone;
    }
  } else {
    cleanPhone = cleanPhone.substring(1); // remove the +
  }

  const message = `Hello ${orderDetails.customerName},\n\nYour tailoring order bill is ready!\n\n📋 Order ID: ${orderDetails.orderId}\n🏪 Shop: ${orderDetails.shopName}\n\n📄 Download your bill here:\n${billUrl}\n\nThank you for choosing us!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");
}
