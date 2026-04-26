import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import {
    ShieldCheck, UserCheck, FileText, Lock, Search,
     CheckCircle2,  LogOut,
    Briefcase, Store, AlertTriangle, Image as ImageIcon, ChevronDown, Check, X
} from "lucide-react";

// --- Types & Mock Data Models ---

type AccountStatus = "pending" | "verified" | "rejected";
type ModuleType = "jobhub" | "marketplace";
type TabType = "verifications" | "registered" | "reported";

interface BaseProfile {
    id: string;
    status: AccountStatus;
    legalName: string;
    email: string;
    submittedAt: string;
}

interface JobHubProfile extends BaseProfile {
    accountType: "corporate" | "individual";
    url: string;
    hqLocation: string;
    overview: string;
    contactNo: string;
    // Corporate Specific
    brNumber?: string;
    // Individual Specific
    nicPassport?: string;
}

interface SellerProfile extends BaseProfile {
    shopName: string;
}

interface ReportedItem {
    id: string;
    type: "job" | "ad";
    title: string;
    reportedBy: string;
    reason: string;
    date: string;
    status: "open" | "resolved";
}

// --- Component ---

export function AdminPortal() {
    const [isAdminAuth, setIsAdminAuth] = useState(false);
    const [adminCreds, setAdminCreds] = useState({ email: "", password: "" });

    // Navigation State
    const [activeModule, setActiveModule] = useState<ModuleType>("jobhub");
    const [activeTab, setActiveTab] = useState<TabType>("verifications");
    const [expandedId, setExpandedId] = useState<string | null>(null);


    // Mock Data State (Replacing useUniStorage for this complex demo)
    const [jobHubProfiles, setJobHubProfiles] = useState<JobHubProfile[]>([
        { id: "JH-101", status: "pending", accountType: "corporate", legalName: "TechCorp Solutions", brNumber: "PV 123456", url: "techcorp.lk", hqLocation: "Colombo 03", overview: "Software engineering firm.", email: "hr@techcorp.lk", contactNo: "0112345678", submittedAt: "2026-04-26" },
        { id: "JH-102", status: "pending", accountType: "individual", legalName: "Kamal Perera", nicPassport: "981234567V", url: "linkedin.com/in/kamal", hqLocation: "Kandy", overview: "Freelance Recruiter.", email: "kamal@gmail.com", contactNo: "0771234567", submittedAt: "2026-04-25" },
        { id: "JH-103", status: "verified", accountType: "corporate", legalName: "Sysco Labs", brNumber: "PV 98765", url: "syscolabs.lk", hqLocation: "Colombo 07", overview: "Enterprise tech.", email: "careers@syscolabs.lk", contactNo: "0119876543", submittedAt: "2026-01-15" }
    ]);

    const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([
        { id: "MK-201", status: "pending", legalName: "Nimal Silva", shopName: "Nimal's Electronics", email: "nimal.shop@gmail.com", submittedAt: "2026-04-26" },
        { id: "MK-202", status: "verified", legalName: "Sara Fernando", shopName: "Campus Books & Rentals", email: "sara.f@gmail.com", submittedAt: "2026-02-10" }
    ]);

    const [reportedItems, setReportedItems] = useState<ReportedItem[]>([
        { id: "REP-01", type: "job", title: "Senior Developer (Fake Link)", reportedBy: "student_a@universe.lk", reason: "External link redirects to a scam site", date: "2026-04-25", status: "open" },
        { id: "REP-02", type: "ad", title: "Scientific Calculator (Rent)", reportedBy: "student_b@universe.lk", reason: "Inappropriate images attached to listing", date: "2026-04-26", status: "open" }
    ]);

    const handleResolveReport = (id: string) => {
        // This updates the state to mark the report as resolved, removing it from the "open" list
        setReportedItems(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
    };

    const handleAdminLogin = () => {
        if (adminCreds.email === "admin@universe.lk" && adminCreds.password === "admin123") {
            setIsAdminAuth(true);
        } else {
            alert("Unauthorized: System Admin Credentials Required.");
        }
    };

    const updateStatus = (id: string, module: ModuleType, status: AccountStatus) => {
        if (module === "jobhub") {
            setJobHubProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        } else {
            setSellerProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        }
        setExpandedId(null);
    };

    if (!isAdminAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl text-white rounded-2xl shadow-2xl">
                    <CardHeader className="text-center pt-10">
                        <div className="size-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Lock className="size-8 text-primary-foreground" />
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

    const currentProfiles = activeModule === "jobhub" ? jobHubProfiles : sellerProfiles;
    const pendingCount = currentProfiles.filter(p => p.status === "pending").length;
    const verifiedCount = currentProfiles.filter(p => p.status === "verified").length;
    const reportsCount = reportedItems.filter(r => r.type === (activeModule === "jobhub" ? "job" : "ad") && r.status === "open").length;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,rgba(37,99,235,0.05),transparent_34%)] bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* --- HEADER --- */}
                <div className="animate-in fade-in rounded-2xl border border-border/70 bg-background/80 p-6 backdrop-blur-md shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="size-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Control Center</h1>
                            <p className="text-xs text-muted-foreground font-medium italic">System Administration & Moderation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-bold">LIVE ADMIN SESSION</Badge>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl font-bold">
                            <LogOut size={14} className="mr-2" /> Exit
                        </Button>
                    </div>
                </div>

                {/* --- MODULE SWITCHER --- */}
                <div className="flex space-x-4">
                    <Button
                        variant={activeModule === "jobhub" ? "default" : "outline"}
                        className={cn("rounded-xl h-12 flex-1 md:flex-none md:w-48 font-bold text-md", activeModule === "jobhub" ? "bg-primary text-white" : "")}
                        onClick={() => { setActiveModule("jobhub"); setActiveTab("verifications"); setExpandedId(null); }}
                    >
                        <Briefcase className="mr-2 size-5" /> Job Hub
                    </Button>
                    <Button
                        variant={activeModule === "marketplace" ? "default" : "outline"}
                        className={cn("rounded-xl h-12 flex-1 md:flex-none md:w-48 font-bold text-md", activeModule === "marketplace" ? "bg-primary text-white" : "")}
                        onClick={() => { setActiveModule("marketplace"); setActiveTab("verifications"); setExpandedId(null); }}
                    >
                        <Store className="mr-2 size-5" /> Marketplace
                    </Button>
                </div>

                {/* --- TAB NAVIGATION & STATS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "verifications" && "border-primary ring-1 ring-primary")}
                        onClick={() => setActiveTab("verifications")}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-50"><CheckCircle2 className="text-orange-500" size={24} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Verifications</p>
                                <p className="text-3xl font-black">{pendingCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "registered" && "border-primary ring-1 ring-primary")}
                        onClick={() => setActiveTab("registered")}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-50"><UserCheck className="text-green-500" size={24} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Accounts</p>
                                <p className="text-3xl font-black">{verifiedCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn("cursor-pointer transition-all hover:border-destructive/50", activeTab === "reported" && "border-destructive ring-1 ring-destructive")}
                        onClick={() => setActiveTab("reported")}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-50"><AlertTriangle className="text-red-500" size={24} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reported {activeModule === "jobhub" ? "Jobs" : "Ads"}</p>
                                <p className="text-3xl font-black text-destructive">{reportsCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- LIST AREA --- */}
                <div className="bg-background/80 rounded-2xl border border-border/70 shadow-sm p-6 backdrop-blur-md min-h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold tracking-tight capitalize">
                            {activeTab} Queue <span className="text-muted-foreground text-sm font-normal">({activeModule === "jobhub" ? "Job Hub" : "Marketplace"})</span>
                        </h2>
                        {activeTab !== "reported" && (
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-xl w-64">
                                <Search className="text-muted-foreground size-4 ml-2" />
                                <Input placeholder="Search records..." className="h-8 border-none bg-transparent focus-visible:ring-0 shadow-none px-2" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* RENDERING REPORTED TAB */}
                        {activeTab === "reported" && (
                            reportedItems.filter(r => r.type === (activeModule === "jobhub" ? "job" : "ad")).length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 font-medium">No reported items pending review.</div>
                            ) : (
                                reportedItems.filter(r => r.type === (activeModule === "jobhub" ? "job" : "ad")).map(report => (
                                    <div key={report.id} className="border border-red-100 bg-red-50/30 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="destructive" className="text-[10px] uppercase font-bold">{report.id}</Badge>
                                                <span className="font-bold text-foreground">{report.title}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground"><span className="font-bold text-red-600/80">Reason:</span> {report.reason}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Reported by {report.reportedBy} on {report.date}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="rounded-xl">View Original</Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="rounded-xl"
                                                onClick={() => handleResolveReport(report.id)}
                                            >
                                                Take Down
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {/* RENDERING VERIFICATIONS OR REGISTERED TAB */}
                        {activeTab !== "reported" && (
                            currentProfiles.filter(p => activeTab === "verifications" ? p.status === "pending" : p.status === "verified").length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 font-medium">No records found for this category.</div>
                            ) : (
                                currentProfiles.filter(p => activeTab === "verifications" ? p.status === "pending" : p.status === "verified").map((profile) => {
                                    const isExpanded = expandedId === profile.id;

                                    return (
                                        <div key={profile.id} className={cn("border rounded-xl transition-all overflow-hidden", isExpanded ? "border-primary shadow-md" : "border-border/70 hover:border-border")}>
                                            {/* List Header */}
                                            <div
                                                className="bg-card p-4 flex items-center justify-between cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                                                        {profile.legalName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                                            {profile.legalName}
                                                            {activeModule === "jobhub" && <Badge variant="outline" className="text-[10px] uppercase font-bold">{(profile as JobHubProfile).accountType}</Badge>}
                                                            {activeModule === "marketplace" && <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-200 text-emerald-700 bg-emerald-50">Seller</Badge>}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">{profile.email} • Submitted: {profile.submittedAt}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {activeTab === "registered" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>}
                                                    <ChevronDown className={cn("text-muted-foreground transition-transform", isExpanded ? "rotate-180" : "")} size={20} />
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="p-6 bg-slate-50/50 border-t border-border/50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Text Fields Mapping */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><FileText size={16}/> Text Details</h4>
                                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                                <div className="text-muted-foreground">Legal Name:</div>
                                                                <div className="font-medium">{profile.legalName}</div>

                                                                <div className="text-muted-foreground">Email:</div>
                                                                <div className="font-medium">{profile.email}</div>

                                                                {/* Job Hub Specific Fields */}
                                                                {activeModule === "jobhub" && (
                                                                    <>
                                                                        <div className="text-muted-foreground">Contact No:</div>
                                                                        <div className="font-medium">{(profile as JobHubProfile).contactNo}</div>
                                                                        <div className="text-muted-foreground">Business URL:</div>
                                                                        <div className="font-medium text-primary hover:underline">{(profile as JobHubProfile).url}</div>
                                                                        <div className="text-muted-foreground">HQ Location:</div>
                                                                        <div className="font-medium">{(profile as JobHubProfile).hqLocation}</div>

                                                                        {(profile as JobHubProfile).accountType === "corporate" && (
                                                                            <>
                                                                                <div className="text-muted-foreground">BR Number:</div>
                                                                                <div className="font-medium">{(profile as JobHubProfile).brNumber}</div>
                                                                            </>
                                                                        )}
                                                                        {(profile as JobHubProfile).accountType === "individual" && (
                                                                            <>
                                                                                <div className="text-muted-foreground">NIC/Passport:</div>
                                                                                <div className="font-medium">{(profile as JobHubProfile).nicPassport}</div>
                                                                            </>
                                                                        )}
                                                                        <div className="text-muted-foreground col-span-2 mt-2">Overview:</div>
                                                                        <div className="font-medium col-span-2 bg-white p-3 rounded-lg border border-border/50">{(profile as JobHubProfile).overview}</div>
                                                                    </>
                                                                )}

                                                                {/* Marketplace Specific Fields */}
                                                                {activeModule === "marketplace" && (
                                                                    <>
                                                                        <div className="text-muted-foreground">Shop Name:</div>
                                                                        <div className="font-medium">{(profile as SellerProfile).shopName}</div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Image Assets Mapping */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><ImageIcon size={16}/> Provided Assets</h4>
                                                            <div className="flex flex-col gap-3">
                                                                <Button variant="outline" className="justify-start h-12 rounded-xl bg-white">
                                                                    <ImageIcon className="mr-3 text-muted-foreground" size={18} /> Review System Logo
                                                                </Button>
                                                                <Button variant="outline" className="justify-start h-12 rounded-xl bg-white">
                                                                    <FileText className="mr-3 text-muted-foreground" size={18} /> Review Authorization Letter
                                                                </Button>

                                                                {activeModule === "jobhub" && (profile as JobHubProfile).accountType === "corporate" && (
                                                                    <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5">
                                                                        <ImageIcon className="mr-3 text-primary" size={18} /> Review BR Certificate
                                                                    </Button>
                                                                )}

                                                                {((activeModule === "jobhub" && (profile as JobHubProfile).accountType === "individual") || activeModule === "marketplace") && (
                                                                    <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5">
                                                                        <ImageIcon className="mr-3 text-primary" size={18} /> Review NIC/Passport
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions (Only for pending) */}
                                                    {activeTab === "verifications" && (
                                                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/50">
                                                            <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => updateStatus(profile.id, activeModule, "rejected")}>
                                                                <X size={16} className="mr-2" /> Reject Application
                                                            </Button>
                                                            <Button className="rounded-xl bg-slate-900 hover:bg-primary" onClick={() => updateStatus(profile.id, activeModule, "verified")}>
                                                                <Check size={16} className="mr-2" /> Verify & Approve Profile
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}