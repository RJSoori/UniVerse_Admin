import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { CheckCircle2, UserCheck, AlertTriangle, Search, ChevronDown, FileText, Image as ImageIcon, Check, X } from "lucide-react";
import type { TabType, SellerProfile, ReportedItem } from "./types";

export function MarketplacePanel() {
    const [activeTab, setActiveTab] = useState<TabType>("verifications");
    const [profiles, setProfiles] = useState<SellerProfile[]>([]);
    const [reports, setReports] = useState<ReportedItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // TODO: Fetch Marketplace data from API
    useEffect(() => {
        // Example: fetchSellerProfiles().then(setProfiles);
        // Example: fetchAdReports().then(setReports);
    }, []);

    const pendingCount = profiles.filter(p => p.status === "pending").length;
    const verifiedCount = profiles.filter(p => p.status === "verified").length;
    const reportsCount = reports.filter(r => r.status === "open").length;

    const updateStatus = (id: string, status: "pending" | "verified" | "rejected") => {
        // TODO: Send update to API
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        setExpandedId(null);
    };

    const handleResolveReport = (id: string) => {
        // TODO: Send resolution to API
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "verifications" && "border-primary ring-1 ring-primary")} onClick={() => setActiveTab("verifications")}>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-50"><CheckCircle2 className="text-orange-500" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Verifications</p>
                            <p className="text-3xl font-black">{pendingCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "registered" && "border-primary ring-1 ring-primary")} onClick={() => setActiveTab("registered")}>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-50"><UserCheck className="text-green-500" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Accounts</p>
                            <p className="text-3xl font-black">{verifiedCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all hover:border-destructive/50", activeTab === "reported" && "border-destructive ring-1 ring-destructive")} onClick={() => setActiveTab("reported")}>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-50"><AlertTriangle className="text-red-500" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reported Ads</p>
                            <p className="text-3xl font-black text-destructive">{reportsCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-background/80 rounded-2xl border border-border/70 shadow-sm p-6 backdrop-blur-md min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight capitalize">{activeTab} Queue</h2>
                    {activeTab !== "reported" && (
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-xl w-64">
                            <Search className="text-muted-foreground size-4 ml-2" />
                            <Input placeholder="Search records..." className="h-8 border-none bg-transparent focus-visible:ring-0 shadow-none px-2" />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {activeTab === "reported" && (
                        reports.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No reported items pending review.</div>
                        ) : (
                            reports.filter(r => r.status === "open").map(report => (
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
                                        <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleResolveReport(report.id)}>Take Down</Button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab !== "reported" && (
                        profiles.filter(p => activeTab === "verifications" ? p.status === "pending" : p.status === "verified").length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No records found for this category.</div>
                        ) : (
                            profiles.filter(p => activeTab === "verifications" ? p.status === "pending" : p.status === "verified").map((profile) => {
                                const isExpanded = expandedId === profile.id;
                                return (
                                    <div key={profile.id} className={cn("border rounded-xl transition-all overflow-hidden", isExpanded ? "border-primary shadow-md" : "border-border/70 hover:border-border")}>
                                        <div className="bg-card p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : profile.id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                                                    {profile.legalName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                                        {profile.legalName}
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-200 text-emerald-700 bg-emerald-50">Seller</Badge>
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">{profile.email} • Submitted: {profile.submittedAt}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {activeTab === "registered" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>}
                                                <ChevronDown className={cn("text-muted-foreground transition-transform", isExpanded ? "rotate-180" : "")} size={20} />
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-6 bg-slate-50/50 border-t border-border/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><FileText size={16}/> Text Details</h4>
                                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                            <div className="text-muted-foreground">Legal Name:</div><div className="font-medium">{profile.legalName}</div>
                                                            <div className="text-muted-foreground">Email:</div><div className="font-medium">{profile.email}</div>
                                                            <div className="text-muted-foreground">Shop Name:</div><div className="font-medium">{profile.shopName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><ImageIcon size={16}/> Provided Assets</h4>
                                                        <div className="flex flex-col gap-3">
                                                            <Button variant="outline" className="justify-start h-12 rounded-xl bg-white"><ImageIcon className="mr-3 text-muted-foreground" size={18} /> Review System Logo</Button>
                                                            <Button variant="outline" className="justify-start h-12 rounded-xl bg-white"><FileText className="mr-3 text-muted-foreground" size={18} /> Review Authorization Letter</Button>
                                                            <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"><ImageIcon className="mr-3 text-primary" size={18} /> Review NIC/Passport</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {activeTab === "verifications" && (
                                                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/50">
                                                        <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => updateStatus(profile.id, "rejected")}><X size={16} className="mr-2" /> Reject</Button>
                                                        <Button className="rounded-xl bg-slate-900 hover:bg-primary" onClick={() => updateStatus(profile.id, "verified")}><Check size={16} className="mr-2" /> Verify & Approve</Button>
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
    );
}