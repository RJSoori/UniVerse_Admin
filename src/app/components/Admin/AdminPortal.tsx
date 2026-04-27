import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { ShieldCheck, LogOut, Briefcase, Store } from "lucide-react";
import type { ModuleType } from "./types";

// Import the newly separated components
import { AdminLogin } from "./AdminLogin";
import { JobHubPanel } from "./JobHubPanel";
import { MarketplacePanel } from "./MarketplacePanel";

export function AdminPortal() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeModule, setActiveModule] = useState<ModuleType>("jobhub");

    const handleLogin = (email: string, pass: string) => {
        // Logging the variables so TypeScript knows they are being used
        console.log("Authenticating:", email, "with password:", pass);

        // TODO: Replace with actual authentication API call
        // E.g., await api.login(email, pass);
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <AdminLogin onLogin={handleLogin} />;
    }

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
                        <Button variant="outline" size="sm" onClick={() => setIsAuthenticated(false)} className="rounded-xl font-bold">
                            <LogOut size={14} className="mr-2" /> Exit
                        </Button>
                    </div>
                </div>

                {/* --- MODULE SWITCHER --- */}
                <div className="flex space-x-4">
                    <Button
                        variant={activeModule === "jobhub" ? "default" : "outline"}
                        className={cn("rounded-xl h-12 flex-1 md:flex-none md:w-48 font-bold text-md", activeModule === "jobhub" ? "bg-primary text-white" : "")}
                        onClick={() => setActiveModule("jobhub")}
                    >
                        <Briefcase className="mr-2 size-5" /> Job Hub
                    </Button>
                    <Button
                        variant={activeModule === "marketplace" ? "default" : "outline"}
                        className={cn("rounded-xl h-12 flex-1 md:flex-none md:w-48 font-bold text-md", activeModule === "marketplace" ? "bg-primary text-white" : "")}
                        onClick={() => setActiveModule("marketplace")}
                    >
                        <Store className="mr-2 size-5" /> Marketplace
                    </Button>
                </div>

                {/* --- ACTIVE PANEL --- */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeModule === "jobhub" ? <JobHubPanel /> : <MarketplacePanel />}
                </div>

            </div>
        </div>
    );
}