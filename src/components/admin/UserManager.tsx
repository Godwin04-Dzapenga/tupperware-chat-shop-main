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
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch visitor logs
      const { data: logsData, error: logsError } = await supabase
        .from("visitor_logs")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setVisitorLogs(logsData || []);

      // Calculate stats
      const uniqueSessions = new Set(logsData?.map(log => log.session_id) || []);
      const today = new Date().toDateString();
      const todayLogs = logsData?.filter(log => 
        new Date(log.visited_at).toDateString() === today
      ) || [];

      setStats({
        totalVisits: logsData?.length || 0,
        uniqueVisitors: uniqueSessions.size,
        registeredUsers: profilesData?.length || 0,
        todayVisits: todayLogs.length,
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
        new Date(p.created_at).toLocaleDateString(),
      ]),
      startY: 25,
    });
    
    doc.save("users.pdf");
    toast.success("Exported to PDF!");
  };

  const exportToCSV = () => {
    const headers = ["Email", "Full Name", "Joined Date"];
    const rows = profiles.map(p => [
      p.email || "N/A",
      p.full_name || "N/A",
      new Date(p.created_at).toLocaleDateString(),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
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
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
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
                  <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
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
                    {log.session_id.substring(0, 12)}...
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
                    {new Date(log.visited_at).toLocaleString()}
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
