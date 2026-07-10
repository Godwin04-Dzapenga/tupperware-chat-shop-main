-- Create a table to track website visitors and user sessions
CREATE TABLE public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  page_path TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert visitor logs"
ON public.visitor_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view visitor logs"
ON public.visitor_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete visitor logs"
ON public.visitor_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_visitor_logs_user_id ON public.visitor_logs(user_id);
CREATE INDEX idx_visitor_logs_visited_at ON public.visitor_logs(visited_at DESC);
CREATE INDEX idx_visitor_logs_session_id ON public.visitor_logs(session_id);