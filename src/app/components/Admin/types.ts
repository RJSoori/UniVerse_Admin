export type AccountStatus = "pending" | "verified" | "rejected";
export type ModuleType = "jobhub" | "marketplace";
export type TabType = "verifications" | "registered" | "reverification" | "reported";

export interface BaseProfile {
    id: string;
    status: AccountStatus;
    legalName: string;
    email: string;
    submittedAt: string;
}

// Recruiters have a 4th status - VERIFIED accounts that edited their profile/documents and
// need re-approval - that plain sellers/marketplace accounts don't. Kept separate from the
// shared AccountStatus/BaseProfile (which SellerProfile also extends) rather than widening
// those, so a marketplace seller can never admit this recruiter-only literal.
export type JobHubStatus = AccountStatus | "re_verification";

export interface JobHubProfile extends Omit<BaseProfile, "status"> {
    status: JobHubStatus;
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
    // For individuals
    profilePictureUrl?: string;
    idDocumentUrl?: string;
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