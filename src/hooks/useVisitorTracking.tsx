import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { z } from "zod";

const visitorLogSchema = z.object({
  session_id: z.string().max(255, "Session ID too long"),
  user_id: z.string().uuid().nullable(),
  page_path: z.string().max(500, "Page path too long"),
  user_agent: z.string().max(1000, "User agent too long"),
  ip_address: z.string().nullable(),
});

export const useVisitorTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Generate or get session ID from localStorage
        let sessionId = localStorage.getItem("visitor_session_id");
        if (!sessionId) {
          sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          localStorage.setItem("visitor_session_id", sessionId);
        }

        // Prepare and validate data
        const rawData = {
          session_id: sessionId.slice(0, 255),
          user_id: user?.id || null,
          page_path: window.location.pathname.slice(0, 500),
          user_agent: navigator.userAgent.slice(0, 1000),
          ip_address: null,
        };

        // Validate before inserting
        const validatedData = visitorLogSchema.parse(rawData) as typeof rawData;

        // Track the visit
        await supabase.from("visitor_logs").insert([validatedData]);
      } catch (error) {
        console.error("Error tracking visit:", error);
      }
    };

    trackVisit();
  }, [user]);
};
