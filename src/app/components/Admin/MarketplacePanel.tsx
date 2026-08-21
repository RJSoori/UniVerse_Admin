import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { CheckCircle2, UserCheck, AlertTriangle, Search, ChevronDown, FileText, Image as ImageIcon, Check, X, Package, RotateCcw } from "lucide-react";
import type { TabType, SellerProfile, ReportedItem, MarketplaceListing, SellerReverificationRequest } from "./types";

interface RawSeller {
    id: number;
    storeName: string;
    email: string;
    phone?: string;
    description?: string;
    status?: string;
    registeredAt?: string;
    identityDocumentUrl?: string;
    shopLogoUrl?: string;
    proofOfItemsUrl?: string;
    warningCount?: number;
    banned?: boolean;
}

const mapSeller = (seller: RawSeller): SellerProfile => {
    const status = seller.status?.toLowerCase() as SellerProfile["status"];
    return {
        id: `${seller.id}`,
        status: status === "verified" || status === "rejected" ? status : "pending",
        legalName: seller.storeName || "Unknown Store",
        email: seller.email,
        submittedAt: seller.registeredAt
            ? new Date(seller.registeredAt).toLocaleDateString()
            : "Unknown",
        shopName: seller.storeName,
        identityDocumentUrl: seller.identityDocumentUrl,
        shopLogoUrl: seller.shopLogoUrl,
        proofOfItemsUrl: seller.proofOfItemsUrl,
        warningCount: seller.warningCount ?? 0,
        banned: seller.banned ?? false,
    };
};

interface RawReport {
    id: number;
    item: MarketplaceListing;
    reportedByName?: string;
    reportedByEmail?: string;
    reason: string;
    status: "OPEN" | "RESOLVED" | "DISMISSED";
    reportedAt?: string;
}

const mapReport = (r: RawReport): ReportedItem & { itemId: number; imageUrl?: string } => ({
    id: `${r.id}`,
    itemId: r.item.id,
    type: "ad",
    title: r.item.itemName,
    imageUrl: r.item.imageUrl,
    reportedBy: r.reportedByName || r.reportedByEmail || "Unknown",
    reason: r.reason,
    date: r.reportedAt ? new Date(r.reportedAt).toLocaleDateString() : "Unknown",
    status: r.status === "RESOLVED" ? "resolved" : r.status === "DISMISSED" ? "dismissed" : "open",
});

interface RawReverification {
    id: number;
    seller: RawSeller;
    reason: string;
    status: "OPEN" | "RESOLVED";
    requestedAt?: string;
}

const mapReverification = (r: RawReverification): SellerReverificationRequest => ({
    id: `${r.id}`,
    sellerId: r.seller.id,
    storeName: r.seller.storeName || "Unknown Store",
    email: r.seller.email,
    reason: r.reason,
    date: r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "Unknown",
    status: r.status === "RESOLVED" ? "resolved" : "open",
});

interface GroupedReport {
    itemId: number;
    title: string;
    imageUrl?: string;
    status: ReturnType<typeof mapReport>["status"];
    representativeId: string;
    entries: { id: string; reportedBy: string; reason: string; date: string }[];
}

// Multiple buyers can report the same listing separately — group those into one card so
// the admin sees the full picture (how many people flagged it, and why) before deciding,
// rather than resolving the same incident one report at a time.
const groupReports = (list: ReturnType<typeof mapReport>[]): GroupedReport[] => {
    const map = new Map<string, GroupedReport>();
    list.forEach(r => {
        const key = `${r.itemId}-${r.status}`;
        const existing = map.get(key);
        if (existing) {
            existing.entries.push({ id: r.id, reportedBy: r.reportedBy, reason: r.reason, date: r.date });
        } else {
            map.set(key, {
                itemId: r.itemId,
                title: r.title,
                imageUrl: r.imageUrl,
                status: r.status,
                representativeId: r.id,
                entries: [{ id: r.id, reportedBy: r.reportedBy, reason: r.reason, date: r.date }],
            });
        }
    });
    return Array.from(map.values());
};

export function MarketplacePanel() {
    const [activeTab, setActiveTab] = useState<TabType>("verifications");
    const [profiles, setProfiles] = useState<SellerProfile[]>([]);
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [reports, setReports] = useState<ReturnType<typeof mapReport>[]>([]);
    const [reportHistory, setReportHistory] = useState<ReturnType<typeof mapReport>[]>([]);
    const [reportView, setReportView] = useState<"pending" | "history">("pending");
    const [reverifications, setReverifications] = useState<SellerReverificationRequest[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchSellers = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const response = await fetch("http://localhost:8080/api/marketplace/sellers", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch sellers: ${response.status}`);
            }
            const data: RawSeller[] = await response.json();
            setProfiles(data.map(mapSeller));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPendingListings = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const response = await fetch("http://localhost:8080/api/marketplace/admin/pending", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch pending listings: ${response.status}`);
            }
            const data: MarketplaceListing[] = await response.json();
            setListings(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReports = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const response = await fetch("http://localhost:8080/api/marketplace/admin/reports", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch reports: ${response.status}`);
            }
            const data: RawReport[] = await response.json();
            setReports(data.map(mapReport));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReportHistory = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const response = await fetch("http://localhost:8080/api/marketplace/admin/reports/history", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch report history: ${response.status}`);
            }
            const data: RawReport[] = await response.json();
            setReportHistory(data.map(mapReport));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReverifications = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const response = await fetch("http://localhost:8080/api/marketplace/admin/reverifications", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch reverification requests: ${response.status}`);
            }
            const data: RawReverification[] = await response.json();
            setReverifications(data.map(mapReverification));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSellers();
        fetchPendingListings();
        fetchReports();
        fetchReportHistory();
        fetchReverifications();
        const interval = setInterval(fetchSellers, 10000);
        return () => clearInterval(interval);
    }, []);

    const pendingCount = profiles.filter(p => p.status === "pending").length;
    const verifiedCount = profiles.filter(p => p.status === "verified").length;
    const listingsCount = listings.length;
    const reportsCount = reports.filter(r => r.status === "open").length;
    const reverificationsCount = reverifications.filter(r => r.status === "open").length;

    const handleApproveListing = async (id: number) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/admin/${id}/approve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to approve listing: ${response.status}`);
            }
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error(error);
            alert("Unable to approve listing. Check the backend connection and try again.");
        }
    };

    const handleRejectListing = async (id: number) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/admin/${id}/reject`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to reject listing: ${response.status}`);
            }
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error(error);
            alert("Unable to reject listing. Check the backend connection and try again.");
        }
    };

    const updateStatus = async (id: string, status: "pending" | "verified" | "rejected") => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(
                `http://localhost:8080/api/marketplace/sellers/${id}/verify?status=${status.toUpperCase()}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }
            setExpandedId(null);
            await fetchSellers();
        } catch (error) {
            console.error(error);
            alert("Unable to update seller status. Check the backend connection and try again.");
        }
    };

    const handleLiftBan = async (id: string) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/sellers/${id}/lift-ban`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to lift ban: ${response.status}`);
            }
            await fetchSellers();
        } catch (error) {
            console.error(error);
            alert("Unable to lift ban. Check the backend connection and try again.");
        }
    };

    const handleResolveReport = async (id: string) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/admin/reports/${id}/resolve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to resolve report: ${response.status}`);
            }
            // Backend resolves every open report against this listing together, not just
            // the one clicked, so refetch both lists rather than patch local state by id.
            await Promise.all([fetchReports(), fetchReportHistory()]);
        } catch (error) {
            console.error(error);
            alert("Unable to take down listing. Check the backend connection and try again.");
        }
    };

    const handleReinstateListing = async (id: string) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/admin/reports/${id}/reinstate`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to reinstate listing: ${response.status}`);
            }
            // Backend dismisses every report in the same batch together, not just the one
            // clicked, so refetch both lists rather than patch local state by id.
            await Promise.all([fetchReports(), fetchReportHistory()]);
        } catch (error) {
            console.error(error);
            alert("Unable to reinstate listing. Check the backend connection and try again.");
        }
    };

    const handleResolveReverification = async (id: string) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`http://localhost:8080/api/marketplace/admin/reverifications/${id}/resolve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to resolve reverification request: ${response.status}`);
            }
            setReverifications(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
        } catch (error) {
            console.error(error);
            alert("Unable to mark request reviewed. Check the backend connection and try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
                <Card className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "listings" && "border-primary ring-1 ring-primary")} onClick={() => setActiveTab("listings")}>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50"><Package className="text-blue-500" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Listings</p>
                            <p className="text-3xl font-black">{listingsCount}</p>
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
                <Card className={cn("cursor-pointer transition-all hover:border-primary/50", activeTab === "reverifications" && "border-primary ring-1 ring-primary")} onClick={() => setActiveTab("reverifications")}>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-50"><RotateCcw className="text-purple-500" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Re-verify Requests</p>
                            <p className="text-3xl font-black">{reverificationsCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-background/80 rounded-2xl border border-border/70 shadow-sm p-6 backdrop-blur-md min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight capitalize">{activeTab} Queue</h2>
                    {activeTab === "reported" && (
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                            <Button
                                variant={reportView === "pending" ? "secondary" : "ghost"}
                                size="sm"
                                className="rounded-lg"
                                onClick={() => setReportView("pending")}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={reportView === "history" ? "secondary" : "ghost"}
                                size="sm"
                                className="rounded-lg"
                                onClick={() => setReportView("history")}
                            >
                                History
                            </Button>
                        </div>
                    )}
                    {activeTab !== "reported" && activeTab !== "listings" && activeTab !== "reverifications" && (
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-xl w-64">
                            <Search className="text-muted-foreground size-4 ml-2" />
                            <Input placeholder="Search records..." className="h-8 border-none bg-transparent focus-visible:ring-0 shadow-none px-2" />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {activeTab === "listings" && (
                        listings.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No pending listings for review.</div>
                        ) : (
                            listings.map(listing => (
                                <div key={listing.id} className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">Listing #{listing.id}</Badge>
                                            <span className="font-bold text-foreground">{listing.itemName}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{listing.type === "SELL" ? "For Sale" : "For Rent"}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                                        <p className="text-xs text-muted-foreground">Listed by {listing.seller.storeName} ({listing.seller.email})</p>
                                        <p className="text-xs text-muted-foreground">Price: LKR {listing.price.toLocaleString()} • Condition: {listing.condition}</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {listing.imageUrl && (
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(listing.imageUrl, "_blank")}>
                                                View Image
                                            </Button>
                                        )}
                                        <Button variant="default" size="sm" className="rounded-xl bg-green-600 hover:bg-green-700" onClick={() => handleApproveListing(listing.id)}>
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                        <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleRejectListing(listing.id)}>
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === "reported" && reportView === "pending" && (
                        groupReports(reports.filter(r => r.status === "open")).length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No reported items pending review.</div>
                        ) : (
                            groupReports(reports.filter(r => r.status === "open")).map(group => (
                                <div key={group.itemId} className="border border-red-100 bg-red-50/30 rounded-xl p-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                                                {group.entries.length} report{group.entries.length === 1 ? "" : "s"}
                                            </Badge>
                                            <span className="font-bold text-foreground">{group.title}</span>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {group.entries.map(entry => (
                                                <p key={entry.id} className="text-sm text-muted-foreground">
                                                    <span className="font-bold text-red-600/80">{entry.reportedBy}:</span> {entry.reason}
                                                    <span className="text-xs"> ({entry.date})</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4 flex-shrink-0">
                                        {group.imageUrl && (
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(group.imageUrl, "_blank")}>View Original</Button>
                                        )}
                                        <Button variant="outline" size="sm" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleReinstateListing(group.representativeId)}>Reinstate (Bogus)</Button>
                                        <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleResolveReport(group.representativeId)}>Take Down</Button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === "reported" && reportView === "history" && (
                        groupReports(reportHistory).length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No takedown history yet.</div>
                        ) : (
                            groupReports(reportHistory).map(group => (
                                <div key={`${group.itemId}-${group.status}`} className="border border-border/70 bg-muted/20 rounded-xl p-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {group.status === "resolved" ? (
                                                <Badge variant="destructive" className="text-[10px] uppercase font-bold">Taken Down</Badge>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 border-none text-[10px] uppercase font-bold">Reinstated</Badge>
                                            )}
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                                {group.entries.length} report{group.entries.length === 1 ? "" : "s"}
                                            </Badge>
                                            <span className="font-bold text-foreground">{group.title}</span>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {group.entries.map(entry => (
                                                <p key={entry.id} className="text-sm text-muted-foreground">
                                                    <span className="font-bold text-muted-foreground">{entry.reportedBy}:</span> {entry.reason}
                                                    <span className="text-xs"> ({entry.date})</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4 flex-shrink-0">
                                        {group.imageUrl && (
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(group.imageUrl, "_blank")}>View Original</Button>
                                        )}
                                        {group.status === "resolved" && (
                                            <Button variant="outline" size="sm" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleReinstateListing(group.representativeId)}>Reinstate</Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === "reverifications" && (
                        reverifications.filter(r => r.status === "open").length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 font-medium">No re-verification requests pending review.</div>
                        ) : (
                            reverifications.filter(r => r.status === "open").map(request => (
                                <div key={request.id} className="border border-purple-100 bg-purple-50/30 rounded-xl p-4 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{request.storeName}</Badge>
                                            <span className="text-xs text-muted-foreground">{request.email}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground"><span className="font-bold text-purple-600/80">Reason:</span> {request.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Requested on {request.date}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => updateStatus(`${request.sellerId}`, "verified")}>
                                            <Check className="w-4 h-4 mr-1" /> Re-verify Seller
                                        </Button>
                                        <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => handleResolveReverification(request.id)}>Mark Reviewed</Button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab !== "reported" && activeTab !== "listings" && activeTab !== "reverifications" && (
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
                                                {activeTab === "registered" && profile.banned && (
                                                    <Badge variant="destructive">Banned</Badge>
                                                )}
                                                {activeTab === "registered" && !profile.banned && !!profile.warningCount && (
                                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{profile.warningCount} strike{profile.warningCount === 1 ? "" : "s"}</Badge>
                                                )}
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
                                                            {profile.identityDocumentUrl ? (
                                                                <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5" onClick={() => window.open(profile.identityDocumentUrl, "_blank")}>
                                                                    <FileText className="mr-3 text-primary" size={18} /> View Identity Document
                                                                </Button>
                                                            ) : (
                                                                <Button disabled variant="outline" className="justify-start h-12 rounded-xl bg-gray-100">
                                                                    <FileText className="mr-3 text-gray-400" size={18} /> Identity Document (Not Provided)
                                                                </Button>
                                                            )}
                                                            {profile.shopLogoUrl ? (
                                                                <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5" onClick={() => window.open(profile.shopLogoUrl, "_blank")}>
                                                                    <ImageIcon className="mr-3 text-primary" size={18} /> View Shop Logo
                                                                </Button>
                                                            ) : (
                                                                <Button disabled variant="outline" className="justify-start h-12 rounded-xl bg-gray-100">
                                                                    <ImageIcon className="mr-3 text-gray-400" size={18} /> Shop Logo (Not Provided)
                                                                </Button>
                                                            )}
                                                            {profile.proofOfItemsUrl ? (
                                                                <Button variant="outline" className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5" onClick={() => window.open(profile.proofOfItemsUrl, "_blank")}>
                                                                    <ImageIcon className="mr-3 text-primary" size={18} /> View Proof of Items
                                                                </Button>
                                                            ) : (
                                                                <Button disabled variant="outline" className="justify-start h-12 rounded-xl bg-gray-100">
                                                                    <ImageIcon className="mr-3 text-gray-400" size={18} /> Proof of Items (Not Provided)
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {activeTab === "registered" && (!!profile.warningCount || profile.banned) && (
                                                    <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-1">Moderation</h4>
                                                            <p className="text-sm">
                                                                {profile.warningCount || 0} confirmed policy violation{profile.warningCount === 1 ? "" : "s"} on record.
                                                                {profile.banned && " Account is currently suspended - new listings blocked, existing listings hidden from buyers."}
                                                            </p>
                                                        </div>
                                                        {profile.banned && (
                                                            <Button variant="outline" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleLiftBan(profile.id)}>
                                                                <Check size={16} className="mr-2" /> Lift Ban
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
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