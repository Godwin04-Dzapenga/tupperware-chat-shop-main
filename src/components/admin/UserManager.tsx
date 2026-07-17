import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Calendar, Activity, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface VisitorLog {
  id: string;
  user_id: string | null;
  session_id: string;
  page_path: string | null;
  visited_at: string;
  user_agent: string | null;
}

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  registeredUsers: number;
  todayVisits: number;
}

export const UserManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState<VisitorStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    registeredUsers: 0,
    todayVisits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // 2. Fetch recent visitor logs (Keep this strictly limited for the UI display)
      const { data: logsData, error: logsError } = await supabase
        .from("visitor_logs")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setVisitorLogs(logsData || []);

      // 3. Accurate Stats Queries via Supabase Aggregation
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Fetch Total Visits Count
      const { count: totalVisitsCount, error: totalErr } = await supabase
        .from("visitor_logs")
        .select("*", { count: "exact", head: true });
        
      if (totalErr) throw totalErr;

      // Fetch Today's Visits Count
      const { count: todayVisitsCount, error: todayErr } = await supabase
        .from("visitor_logs")
        .select("*", { count: "exact", head: true })
        .gte("visited_at", startOfToday.toISOString());

      if (todayErr) throw todayErr;

      // Calculate Unique Visitors via PostgreSQL counting (Fallback to local unique session logic if tracking code guarantees it)
      // Note: If you want a perfectly scalable 'Unique' count, a Postgres RPC function is ideal, 
      // but for mid-scale, retrieving just the session_id column prevents payload bloating:
      const { data: allSessions, error: sessionErr } = await supabase
        .from("visitor_logs")
        .select("session_id");

      if (sessionErr) throw sessionErr;
      const uniqueSessionsCount = new Set(allSessions?.map(s => s.session_id)).size;

      setStats({
        totalVisits: totalVisitsCount || 0,
        uniqueVisitors: uniqueSessionsCount,
        registeredUsers: profilesData?.length || 0,
        todayVisits: todayVisitsCount || 0,
      });

    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      profiles.map(p => ({
        Email: p.email || "N/A",
        "Full Name": p.full_name || "N/A",
        "Joined Date": new Date(p.created_at).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users.xlsx");
    toast.success("Exported to Excel!");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Registered Users", 14, 15);
    
    autoTable(doc, {
      head: [["Email", "Full Name", "Joined Date"]],
      body: profiles.map(p => [
        p.email || "N/A",
        p.full_name || "N/A",
        p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A",
      ]),
      startY: 25,
    });
    
    doc.save("users.pdf");
    toast.success("Exported to PDF!");
  };

  const exportToCSV = () => {
    const headers = ["Email", "Full Name", "Joined Date"];
    const rows = profiles.map(p => [
      `"${p.email || 'N/A'}"`,
      `"${p.full_name || 'N/A'}"`,
      `"${p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}"`,
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported to CSV!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Registered Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.email || "N/A"}</TableCell>
                  <TableCell>{profile.full_name || "N/A"}</TableCell>
                  <TableCell>
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {profiles.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Visitor Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visitor Activity</CardTitle>
          <CardDescription>Latest 100 page visits</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>User Status</TableHead>
                <TableHead>Visited At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitorLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {log.session_id ? `${log.session_id.substring(0, 12)}...` : "N/A"}
                  </TableCell>
                  <TableCell>{log.page_path || "/"}</TableCell>
                  <TableCell>
                    {log.user_id ? (
                      <Badge>Registered</Badge>
                    ) : (
                      <Badge variant="secondary">Guest</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.visited_at ? new Date(log.visited_at).toLocaleString() : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {visitorLogs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No visitor activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};