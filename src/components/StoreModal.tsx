import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Mail, CheckCircle2, Truck, ShieldCheck, MessageCircle } from "lucide-react";

interface StoreModalProps {
  open: boolean;
  onClose: () => void;
}

const WHATSAPP = "263778158984";

export const StoreModal = ({ open, onClose }: StoreModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="bg-[#0046be] text-white p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffe000]">
            <MapPin className="h-4 w-4" /> Harare Showroom & Fulfillment Hub
          </div>
          <DialogTitle className="text-2xl font-black mt-2 text-white">
            Tech Innovation Store & Warehouse
          </DialogTitle>
          <p className="text-sm text-white/80 mt-1">
            Pick up your solar panels, inverters, and lithium batteries in person or arrange prompt nationwide dispatch.
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Store Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0046be]">
                <Clock className="h-4 w-4" /> Operating Hours
              </div>
              <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                <li className="flex justify-between">
                  <span className="font-semibold">Monday – Friday:</span>
                  <span>8:00 AM – 5:30 PM</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold">Saturday:</span>
                  <span>8:30 AM – 2:00 PM</span>
                </li>
                <li className="flex justify-between text-slate-500">
                  <span className="font-semibold">Sunday & Holidays:</span>
                  <span>On-call / WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0046be]">
                <Phone className="h-4 w-4" /> Direct Contact
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                <p><strong>Hotline:</strong> 0778158984 / 0784721912</p>
                <p><strong>Email:</strong> infotitechinnovations@gmail.com</p>
                <p><strong>City:</strong> Harare, Zimbabwe</p>
              </div>
            </div>
          </div>

          {/* Pickup & Delivery details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Fulfillment Options
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Free In-Store Pickup</p>
                  <p className="text-slate-600">Ready in 2 hours for orders placed before 3:00 PM. Our warehouse team will inspect and test equipment with you before loading.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs">
                <Truck className="h-5 w-5 shrink-0 text-[#0046be] mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Harare Doorstep Delivery & Nationwide Freight</p>
                  <p className="text-slate-600">Same-day delivery across Greater Harare. Daily courier and secure freight service to Bulawayo, Gweru, Mutare, Masvingo, Victoria Falls & all provinces.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Certified Solar Installation Service</p>
                  <p className="text-slate-600">Our engineering technicians provide full on-site installation, COC certification, and commissioning across Zimbabwe.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              onClick={() => {
                window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello Tech Innovation, I would like to visit the Harare showroom.")}`, "_blank");
                onClose();
              }}
              className="flex-1 bg-[#25D366] text-white hover:bg-[#128C7E] font-bold h-11"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Chat with Showroom Team
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="font-bold h-11 sm:w-28"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
