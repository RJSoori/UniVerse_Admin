export type AccountStatus = "pending" | "verified" | "rejected";
export type ModuleType = "jobhub" | "marketplace";
export type TabType = "verifications" | "registered" | "jobs" | "reported";

export interface BaseProfile {
    id: string;
    status: AccountStatus;
    legalName: string;
    email: string;
    submittedAt: string;
}

export interface JobHubProfile extends BaseProfile {
    accountType: "corporate" | "individual";
    url: string;
    hqLocation: string;
    overview: string;
    contactNo: string;
    brNumber?: string;
    nicPassport?: string;
    businessRegistrationUrl?: string;
    orgLogoUrl?: string;
    authLetterUrl?: string;
}

export interface SellerProfile extends BaseProfile {
    shopName: string;
}

export interface ReportedItem {
    id: string;
    type: "job" | "ad";
    title: string;
    reportedBy: string;
    reason: string;
    date: string;
    status: "open" | "resolved";
}

export interface JobItem {
    id: number;
    title: string;
    description: string;
    externalApplicationUrl: string;
    recruiter: {
        id: number;
        companyName: string;
        email: string;
    };
    status: "PENDING" | "APPROVED" | "REJECTED";
}