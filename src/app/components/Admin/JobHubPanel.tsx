import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import {
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Ban,
  ShieldAlert,
} from "lucide-react";
import type { TabType, JobHubProfile } from "./types";

interface RawReportedRecruiter {
  id: number;
  companyName?: string;
  email?: string;
  contactPerson?: string;
}

interface RawReportedJob {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  skills?: string;
  salaryInfo?: string;
  workType?: string;
  employmentType?: string;
  postedAt?: string;
  active: boolean;
  underReview: boolean;
  blocked: boolean;
  recruiter?: RawReportedRecruiter;
}

// One row per student report - a single job can carry several of these before an admin acts,
// which is why the UI below groups them by job rather than rendering one row per report.
interface RawJobReport {
  id: number;
  job: RawReportedJob;
  reportedByStudentId: number;
  reason: string;
  reportedAt: string;
  resolved: boolean;
}

interface ReportedJobGroup {
  job: RawReportedJob;
  reports: RawJobReport[];
}

interface RawRecruiter {
  id: number;
  companyName: string;
  email: string;
  contactPerson: string;
  accountType?: "corporate" | "individual" | "company";
  businessRegistrationUrl?: string;
  orgLogoUrl?: string;
  authLetterUrl?: string;
  status: string;
  registeredAt?: string;
  // For individuals
  profilePictureUrl?: string;
  idDocumentUrl?: string;
}

const mapRecruiter = (recruiter: RawRecruiter): JobHubProfile => {
  // Recruiter.status is a Java enum name (e.g. "RE_VERIFICATION") - lowercasing keeps the
  // underscore, so the literal here must be "re_verification", not "reverification".
  const rawStatus = recruiter.status?.toLowerCase();
  const status: JobHubProfile["status"] =
    rawStatus === "verified" || rawStatus === "rejected" || rawStatus === "re_verification"
      ? rawStatus
      : "pending";
  const rawAccountType =
    recruiter.accountType ||
    (recruiter.businessRegistrationUrl ? "corporate" : "individual");
  const accountType =
    rawAccountType === "company" ? "corporate" : rawAccountType;
  return {
    id: `${recruiter.id}`,
    status,
    legalName:
      accountType === "individual"
        ? recruiter.contactPerson ||
          recruiter.companyName ||
          "Unknown Individual"
        : recruiter.companyName || "Unknown Company",
    email: recruiter.email,
    submittedAt: recruiter.registeredAt
      ? new Date(recruiter.registeredAt).toLocaleDateString()
      : "Unknown",
    accountType,
    url:
      accountType === "corporate" && recruiter.businessRegistrationUrl
        ? recruiter.businessRegistrationUrl
        : "N/A",
    hqLocation: "Not provided",
    overview: recruiter.contactPerson
      ? `Contact person: ${recruiter.contactPerson}`
      : "No additional details provided.",
    contactNo: recruiter.contactPerson,
    brNumber: recruiter.businessRegistrationUrl
      ? "BR document provided"
      : undefined,
    nicPassport: recruiter.authLetterUrl ? "Auth letter provided" : undefined,
    businessRegistrationUrl: recruiter.businessRegistrationUrl,
    orgLogoUrl: recruiter.orgLogoUrl,
    authLetterUrl: recruiter.authLetterUrl,
    profilePictureUrl: recruiter.profilePictureUrl,
    idDocumentUrl: recruiter.idDocumentUrl,
  };
};

export function JobHubPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("verifications");
  const [profiles, setProfiles] = useState<JobHubProfile[]>([]);
  const [jobReports, setJobReports] = useState<RawJobReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecruiters = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(
        "http://localhost:8080/api/jobs/recruiters",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch recruiters: ${response.status}`);
      }
      const data: RawRecruiter[] = await response.json();
      setProfiles(data.map(mapRecruiter));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReportedJobs = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(
        "http://localhost:8080/api/jobs/admin/reported",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch reported jobs: ${response.status}`);
      }
      const data: RawJobReport[] = await response.json();
      setJobReports(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecruiters();
    fetchReportedJobs();
    const interval = setInterval(() => {
      fetchRecruiters();
      fetchReportedJobs();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Group individual report rows by the job they're against - a job can be reported by
  // several students before an admin acts, and the UI shows one expandable row per job.
  const reportedGroups: ReportedJobGroup[] = [];
  for (const report of jobReports) {
    const existing = reportedGroups.find((g) => g.job.id === report.job.id);
    if (existing) {
      existing.reports.push(report);
    } else {
      reportedGroups.push({ job: report.job, reports: [report] });
    }
  }

  const pendingCount = profiles.filter((p) => p.status === "pending").length;
  const verifiedCount = profiles.filter((p) => p.status === "verified").length;
  const reverificationCount = profiles.filter((p) => p.status === "re_verification").length;
  const reportsCount = reportedGroups.length;

  // Which profile status each of the profile-driven tabs shows - "reported" has its own
  // dedicated block below and never matches a profile here.
  const profileStatusForTab = (tab: TabType): JobHubProfile["status"] | null => {
    if (tab === "verifications") return "pending";
    if (tab === "registered") return "verified";
    if (tab === "reverification") return "re_verification";
    return null;
  };

  const updateStatus = async (
    id: string,
    status: "pending" | "verified" | "rejected",
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:8080/api/jobs/recruiters/${id}/verify?status=${status.toUpperCase()}`,
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
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
      setExpandedId(null);
      // Refresh data to ensure consistency with backend
      setTimeout(() => {
        const token = localStorage.getItem("adminToken");
        fetch("http://localhost:8080/api/jobs/recruiters", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch recruiters: ${response.status}`);
            }
            return response.json();
          })
          .then((data: RawRecruiter[]) => setProfiles(data.map(mapRecruiter)))
          .catch((error) => {
            console.error(error);
          });
      }, 500);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to update recruiter status. Check the backend connection and try again.",
      );
    }
  };

  const handleDismissReport = async (jobId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:8080/api/jobs/admin/${jobId}/dismiss-report`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to dismiss report: ${response.status}`);
      }
      // Dismissed reports are resolved server-side, so they drop out of the unresolved list -
      // just remove this job's rows locally rather than waiting for the next poll.
      setJobReports((prev) => prev.filter((r) => r.job.id !== jobId));
      setExpandedId(null);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to dismiss the report. Check the backend connection and try again.",
      );
    }
  };

  const handleBlockJob = async (jobId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:8080/api/jobs/admin/${jobId}/block`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to block posting: ${response.status}`);
      }
      setJobReports((prev) => prev.filter((r) => r.job.id !== jobId));
      setExpandedId(null);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to block the posting. Check the backend connection and try again.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            activeTab === "verifications" &&
              "border-primary ring-1 ring-primary",
          )}
          onClick={() => setActiveTab("verifications")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50">
              <CheckCircle2 className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                New Verifications
              </p>
              <p className="text-3xl font-black">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            activeTab === "registered" && "border-primary ring-1 ring-primary",
          )}
          onClick={() => setActiveTab("registered")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <UserCheck className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Registered Accounts
              </p>
              <p className="text-3xl font-black">{verifiedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            activeTab === "reverification" &&
              "border-primary ring-1 ring-primary",
          )}
          onClick={() => setActiveTab("reverification")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <RefreshCw className="text-amber-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Re-verification Requests
              </p>
              <p className="text-3xl font-black">{reverificationCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-destructive/50",
            activeTab === "reported" &&
              "border-destructive ring-1 ring-destructive",
          )}
          onClick={() => setActiveTab("reported")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Reported Jobs
              </p>
              <p className="text-3xl font-black text-destructive">
                {reportsCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List Area */}
      <div className="bg-background/80 rounded-2xl border border-border/70 shadow-sm p-6 backdrop-blur-md min-h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight capitalize">
            {activeTab} Queue
          </h2>
          {activeTab !== "reported" && (
            <div className="flex items-center gap-2 bg-muted p-2 rounded-xl w-64">
              <Search className="text-muted-foreground size-4 ml-2" />
              <Input
                placeholder="Search records..."
                className="h-8 border-none bg-transparent focus-visible:ring-0 shadow-none px-2"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Render Reported Jobs - grouped by posting, each expandable to the full posting
              detail plus every report filed against it. */}
          {activeTab === "reported" &&
            (reportedGroups.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 font-medium">
                No reported jobs pending review.
              </div>
            ) : (
              reportedGroups.map(({ job, reports: jobReportRows }) => {
                const rowId = `job-${job.id}`;
                const isExpanded = expandedId === rowId;
                const latestReport = jobReportRows.reduce((latest, r) =>
                  new Date(r.reportedAt) > new Date(latest.reportedAt) ? r : latest,
                );
                return (
                  <div
                    key={rowId}
                    className={cn(
                      "border rounded-xl transition-all overflow-hidden",
                      isExpanded
                        ? "border-destructive shadow-md"
                        : "border-red-100 hover:border-destructive/40",
                    )}
                  >
                    <div
                      className="bg-red-50/30 p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : rowId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground flex items-center gap-2">
                            {job.title}
                            <Badge
                              variant="destructive"
                              className="text-[10px] uppercase font-bold"
                            >
                              {jobReportRows.length} report
                              {jobReportRows.length === 1 ? "" : "s"}
                            </Badge>
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {job.recruiter?.companyName || "Unknown recruiter"} • Latest report:{" "}
                            {new Date(latestReport.reportedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "text-muted-foreground transition-transform",
                          isExpanded ? "rotate-180" : "",
                        )}
                        size={20}
                      />
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-slate-50/50 border-t border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                              <FileText size={16} /> Job Posting Details
                            </h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                              <div className="text-muted-foreground">Title:</div>
                              <div className="font-medium">{job.title}</div>
                              <div className="text-muted-foreground">Recruiter:</div>
                              <div className="font-medium">
                                {job.recruiter?.companyName || "Unknown"}
                                {job.recruiter?.email ? ` (${job.recruiter.email})` : ""}
                              </div>
                              <div className="text-muted-foreground">Work Type:</div>
                              <div className="font-medium">{job.workType || "N/A"}</div>
                              <div className="text-muted-foreground">Employment:</div>
                              <div className="font-medium">{job.employmentType || "N/A"}</div>
                              <div className="text-muted-foreground">Salary:</div>
                              <div className="font-medium">{job.salaryInfo || "N/A"}</div>
                              <div className="text-muted-foreground">Posted:</div>
                              <div className="font-medium">{job.postedAt || "N/A"}</div>
                              <div className="text-muted-foreground">Skills:</div>
                              <div className="font-medium">{job.skills || "N/A"}</div>
                              <div className="text-muted-foreground col-span-2 mt-2">
                                Description:
                              </div>
                              <div className="font-medium col-span-2 bg-white p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                                {job.description || "No description provided."}
                              </div>
                              <div className="text-muted-foreground col-span-2 mt-2">
                                Requirements:
                              </div>
                              <div className="font-medium col-span-2 bg-white p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                                {job.requirements || "No requirements provided."}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                              <ShieldAlert size={16} /> Reports ({jobReportRows.length})
                            </h4>
                            <div className="flex flex-col gap-3">
                              {jobReportRows
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(b.reportedAt).getTime() -
                                    new Date(a.reportedAt).getTime(),
                                )
                                .map((r) => (
                                  <div
                                    key={r.id}
                                    className="bg-white border border-border/50 rounded-lg p-3"
                                  >
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Student #{r.reportedByStudentId} •{" "}
                                      {new Date(r.reportedAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm font-medium">{r.reason}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => handleDismissReport(job.id)}
                          >
                            <Check size={16} className="mr-2" /> Dismiss Report
                          </Button>
                          <Button
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => handleBlockJob(job.id)}
                          >
                            <Ban size={16} className="mr-2" /> Block Posting
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ))}

          {/* Render Profiles - "reported" has its own dedicated block above and never matches
              a profile status, so it's excluded here rather than falling through to an
              incorrect default. */}
          {activeTab !== "reported" &&
            (profiles.filter((p) => p.status === profileStatusForTab(activeTab)).length === 0 ? (
              <div className="text-center text-muted-foreground py-10 font-medium">
                No records found for this category.
              </div>
            ) : (
              profiles
                .filter((p) => p.status === profileStatusForTab(activeTab))
                .map((profile) => {
                  const isExpanded = expandedId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      className={cn(
                        "border rounded-xl transition-all overflow-hidden",
                        isExpanded
                          ? "border-primary shadow-md"
                          : "border-border/70 hover:border-border",
                      )}
                    >
                      <div
                        className="bg-card p-4 flex items-center justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : profile.id)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                            {profile.legalName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                              {profile.legalName}
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold"
                              >
                                {profile.accountType}
                              </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {profile.email} • Submitted: {profile.submittedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {activeTab === "registered" && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Verified
                            </Badge>
                          )}
                          {activeTab === "reverification" && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Re-verification
                            </Badge>
                          )}
                          <ChevronDown
                            className={cn(
                              "text-muted-foreground transition-transform",
                              isExpanded ? "rotate-180" : "",
                            )}
                            size={20}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6 bg-slate-50/50 border-t border-border/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                                <FileText size={16} /> Text Details
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                <div className="text-muted-foreground">
                                  Legal Name:
                                </div>
                                <div className="font-medium">
                                  {profile.legalName}
                                </div>
                                <div className="text-muted-foreground">
                                  Email:
                                </div>
                                <div className="font-medium">
                                  {profile.email}
                                </div>
                                <div className="text-muted-foreground">
                                  Contact No:
                                </div>
                                <div className="font-medium">
                                  {profile.contactNo}
                                </div>
                                <div className="text-muted-foreground">
                                  HQ Location:
                                </div>
                                <div className="font-medium">
                                  {profile.hqLocation}
                                </div>
                                {profile.accountType === "corporate" && (
                                  <>
                                    <div className="text-muted-foreground">
                                      BR Number:
                                    </div>
                                    <div className="font-medium">
                                      {profile.brNumber}
                                    </div>
                                  </>
                                )}
                                {profile.accountType === "individual" && (
                                  <>
                                    <div className="text-muted-foreground">
                                      NIC/Passport:
                                    </div>
                                    <div className="font-medium">
                                      {profile.nicPassport}
                                    </div>
                                  </>
                                )}
                                <div className="text-muted-foreground col-span-2 mt-2">
                                  Overview:
                                </div>
                                <div className="font-medium col-span-2 bg-white p-3 rounded-lg border border-border/50">
                                  {profile.overview}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                                <ImageIcon size={16} /> Provided Assets
                              </h4>
                              <div className="flex flex-col gap-3">
                                {/* Corporate Assets */}
                                {profile.accountType === "corporate" && (
                                  <>
                                    {profile.orgLogoUrl ? (
                                      <Button
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"
                                        onClick={() =>
                                          window.open(
                                            profile.orgLogoUrl,
                                            "_blank",
                                          )
                                        }
                                      >
                                        <ImageIcon
                                          className="mr-3 text-primary"
                                          size={18}
                                        />{" "}
                                        View Organization Logo
                                      </Button>
                                    ) : (
                                      <Button
                                        disabled
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-gray-100"
                                      >
                                        <ImageIcon
                                          className="mr-3 text-gray-400"
                                          size={18}
                                        />{" "}
                                        Organization Logo (Not Provided)
                                      </Button>
                                    )}
                                    {profile.authLetterUrl ? (
                                      <Button
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"
                                        onClick={() =>
                                          window.open(
                                            profile.authLetterUrl,
                                            "_blank",
                                          )
                                        }
                                      >
                                        <FileText
                                          className="mr-3 text-primary"
                                          size={18}
                                        />{" "}
                                        View Authorization Letter
                                      </Button>
                                    ) : (
                                      <Button
                                        disabled
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-gray-100"
                                      >
                                        <FileText
                                          className="mr-3 text-gray-400"
                                          size={18}
                                        />{" "}
                                        Authorization Letter (Not Provided)
                                      </Button>
                                    )}
                                    {profile.businessRegistrationUrl ? (
                                      <Button
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"
                                        onClick={() =>
                                          window.open(
                                            profile.businessRegistrationUrl,
                                            "_blank",
                                          )
                                        }
                                      >
                                        <FileText
                                          className="mr-3 text-primary"
                                          size={18}
                                        />{" "}
                                        View BR Certificate
                                      </Button>
                                    ) : (
                                      <Button
                                        disabled
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-gray-100"
                                      >
                                        <FileText
                                          className="mr-3 text-gray-400"
                                          size={18}
                                        />{" "}
                                        BR Certificate (Not Provided)
                                      </Button>
                                    )}
                                  </>
                                )}
                                {/* Individual Assets */}
                                {profile.accountType === "individual" && (
                                  <>
                                    {profile.profilePictureUrl ? (
                                      <Button
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"
                                        onClick={() =>
                                          window.open(
                                            profile.profilePictureUrl,
                                            "_blank",
                                          )
                                        }
                                      >
                                        <ImageIcon
                                          className="mr-3 text-primary"
                                          size={18}
                                        />{" "}
                                        View Profile Picture
                                      </Button>
                                    ) : (
                                      <Button
                                        disabled
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-gray-100"
                                      >
                                        <ImageIcon
                                          className="mr-3 text-gray-400"
                                          size={18}
                                        />{" "}
                                        Profile Picture (Not Provided)
                                      </Button>
                                    )}
                                    {profile.idDocumentUrl ? (
                                      <Button
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-white border-primary/20 hover:bg-primary/5"
                                        onClick={() =>
                                          window.open(
                                            profile.idDocumentUrl,
                                            "_blank",
                                          )
                                        }
                                      >
                                        <FileText
                                          className="mr-3 text-primary"
                                          size={18}
                                        />{" "}
                                        View ID Document
                                      </Button>
                                    ) : (
                                      <Button
                                        disabled
                                        variant="outline"
                                        className="justify-start h-12 rounded-xl bg-gray-100"
                                      >
                                        <FileText
                                          className="mr-3 text-gray-400"
                                          size={18}
                                        />{" "}
                                        ID Document (Not Provided)
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {(activeTab === "verifications" || activeTab === "reverification") && (
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/50">
                              <Button
                                variant="outline"
                                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  updateStatus(profile.id, "rejected")
                                }
                              >
                                <X size={16} className="mr-2" /> Reject
                              </Button>
                              <Button
                                className="rounded-xl bg-slate-900 hover:bg-primary"
                                onClick={() =>
                                  updateStatus(profile.id, "verified")
                                }
                              >
                                <Check size={16} className="mr-2" /> Verify &
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            ))}
        </div>
      </div>
    </div>
  );
}
