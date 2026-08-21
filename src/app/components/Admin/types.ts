export type AccountStatus = "pending" | "verified" | "rejected";
export type ModuleType = "jobhub" | "marketplace";
export type TabType = "verifications" | "registered" | "jobs" | "listings" | "reported" | "reverifications";

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
    // For individuals
    profilePictureUrl?: string;
    idDocumentUrl?: string;
}

export interface SellerProfile extends BaseProfile {
    shopName: string;
    identityDocumentUrl?: string;
    shopLogoUrl?: string;
    proofOfItemsUrl?: string;
    warningCount?: number;
    banned?: boolean;
}

export interface ReportedItem {
    id: string;
    type: "job" | "ad";
    title: string;
    reportedBy: string;
    reason: string;
    date: string;
    status: "open" | "resolved" | "dismissed";
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

export interface SellerReverificationRequest {
    id: string;
    sellerId: number;
    storeName: string;
    email: string;
    reason: string;
    status: "open" | "resolved";
    date: string;
}

export interface MarketplaceListing {
    id: number;
    itemName: string;
    description: string;
    price: number;
    type: "SELL" | "RENT";
    condition: string;
    status: string;
    imageUrl?: string;
    seller: {
        id: number;
        storeName: string;
        email: string;
    };
}