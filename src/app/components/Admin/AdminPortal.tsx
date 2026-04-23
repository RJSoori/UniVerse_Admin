import { useState } from "react";
import { useUniStorage } from "../../hooks/useUniStorage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils"; // Import cn for styling
import {
    ShieldCheck, UserCheck, UserX, FileText, Lock, Search,
    LayoutGrid, CheckCircle2, History, LogOut, Terminal, GraduationCap
} from "lucide-react";

export function AdminPortal() {
    const [isAdminAuth, setIsAdminAuth] = useState(false);
    const [adminCreds, setAdminCreds] = useState({ email: "", password: "" });
    const [recruiters, setRecruiters] = useUniStorage<any[]>("registered-recruiters", []);
    const [searchTerm, setSearchTerm] = useState("");

    const handleAdminLogin = () => {
        if (adminCreds.email === "admin@universe.lk" && adminCreds.password === "admin123") {
            setIsAdminAuth(true);
        } else {
            alert("Unauthorized: System Admin Credentials Required.");
        }
    };

    const updateStatus = (email: string, status: "verified" | "rejected") => {
        const updated = recruiters.map(r => r.email === email ? { ...r, status } : r);
        setRecruiters(updated);
    };

    if (!isAdminAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl text-white rounded-2xl shadow-2xl">
                    <CardHeader className="text-center pt-10">
                        <div className="size-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <GraduationCap className="size-8 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight uppercase">Admin Terminal</CardTitle>
                        <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">UniVerse Internal Root</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-12 px-10">
                        <Input placeholder="admin@universe.lk" className="bg-white/5 border-white/10 h-11 px-4 rounded-xl text-sm" onChange={(e) => setAdminCreds({...adminCreds, email: e.target.value})} />
                        <Input type="password" placeholder="Password" className="bg-white/5 border-white/10 h-11 px-4 rounded-xl" onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
                        <Button className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white mt-2" onClick={handleAdminLogin}>Unlock System</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,rgba(37,99,235,0.05),transparent_34%)] bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Matched to Student UI */}
                <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border/70 bg-background/80 p-6 backdrop-blur-md duration-500 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="size-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Control Center</h1>
                            <p className="text-xs text-muted-foreground font-medium italic">Ecosystem Partner Verification</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-bold">LIVE ADMIN SESSION</Badge>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl font-bold">
                            <LogOut size={14} className="mr-2" /> Exit
                        </Button>
                    </div>
                </div>

                {/* Stats Cards Matched */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Pending", val: recruiters.filter(r => r.status === 'pending').length, icon: LayoutGrid, color: "text-orange-500", bg: "bg-orange-50" },
                        { label: "Verified", val: recruiters.filter(r => r.status === 'verified').length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
                        { label: "Total Partners", val: recruiters.length, icon: History, color: "text-primary", bg: "bg-primary/5" }
                    ].map((stat, i) => (
                        <div key={i} className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl", stat.bg)}><stat.icon className={stat.color} size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black">{stat.val}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & List Matched */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-background/80 p-3 rounded-2xl border border-border/70 shadow-sm backdrop-blur-sm">
                        <Search className="text-muted-foreground ml-2" size={20} />
                        <Input placeholder="Search partners..." className="bg-transparent border-none shadow-none focus-visible:ring-0 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {recruiters.filter(r => r.email.includes(searchTerm)).map((recruiter) => (
                            <div key={recruiter.email} className="group hover:translate-x-1 transition-all rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="size-14 bg-muted rounded-xl flex items-center justify-center font-black text-xl text-muted-foreground/50">
                                        {recruiter.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight">{recruiter.email}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant={recruiter.status === 'verified' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase">
                                                {recruiter.status || "Pending"}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase opacity-50">{recruiter.type}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold px-4">Assets</Button>
                                    {recruiter.status !== 'verified' && (
                                        <Button size="sm" className="bg-slate-900 hover:bg-primary rounded-xl px-6 font-bold text-white transition-colors" onClick={() => updateStatus(recruiter.email, "verified")}>
                                            Approve
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl"><UserX className="size-5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}