import mongoose from "mongoose";

const registryValidationSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["SKIPPED", "MATCHED", "PARTIAL", "NOT_FOUND", "ERROR"],
      default: "SKIPPED"
    },
    checkedAt: {
      type: Date,
      default: null
    },
    message: {
      type: String,
      default: "",
      trim: true
    },
    matchedName: {
      type: Boolean,
      default: false
    },
    matchedCompanyNumber: {
      type: Boolean,
      default: false
    },
    jurisdictionCode: {
      type: String,
      default: "",
      trim: true
    },
    companyNumber: {
      type: String,
      default: "",
      trim: true
    },
    companyStatus: {
      type: String,
      default: "",
      trim: true
    },
    registryUrl: {
      type: String,
      default: "",
      trim: true
    },
    source: {
      type: String,
      default: "",
      trim: true
    }
  },
  { _id: false }
);

const verificationAnalysisSchema = new mongoose.Schema(
  {
    analysisStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING"
    },
    extractor: {
      type: String,
      default: "",
      trim: true
    },
    analyzedAt: {
      type: Date,
      default: null
    },
    extractedTextPreview: {
      type: String,
      default: "",
      trim: true
    },
    extractedTextLength: {
      type: Number,
      default: 0
    },
    ocrConfidence: {
      type: Number,
      default: null
    },
    authenticityScore: {
      type: Number,
      default: 0
    },
    recommendation: {
      type: String,
      enum: [
        "HIGH_CONFIDENCE",
        "MEDIUM_CONFIDENCE",
        "LOW_CONFIDENCE",
        "MANUAL_REVIEW",
        "ANALYSIS_FAILED"
      ],
      default: "MANUAL_REVIEW"
    },
    matchedSignals: [
      {
        type: String,
        trim: true
      }
    ],
    riskFlags: [
      {
        type: String,
        trim: true
      }
    ],
    extractedRegistrationNumbers: [
      {
        type: String,
        trim: true
      }
    ],
    registryValidation: {
      type: registryValidationSchema,
      default: () => ({})
    },
    errorMessage: {
      type: String,
      default: "",
      trim: true
    }
  },
  { _id: false }
);

const companyCertificateSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      default: "",
      trim: true
    },
    storedName: {
      type: String,
      default: "",
      trim: true
    },
    mimeType: {
      type: String,
      default: "",
      trim: true
    },
    size: {
      type: Number,
      default: 0
    },
    path: {
      type: String,
      default: "",
      trim: true
    },
    hash: {
      type: String,
      default: "",
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    website: {
      type: String,
      default: "",
      trim: true
    },
    location: {
      type: String,
      default: "",
      trim: true
    },
    industry: {
      type: String,
      default: "",
      trim: true
    },
    size: {
      type: String,
      default: "",
      trim: true
    },
    businessEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    registrationNumber: {
      type: String,
      default: "",
      trim: true
    },
    registrationJurisdiction: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true
    },
    verificationStatus: {
      type: String,
      enum: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
      default: "UNVERIFIED"
    },
    verificationNotes: {
      type: String,
      default: "",
      trim: true
    },
    verificationSubmittedAt: {
      type: Date,
      default: null
    },
    verificationReviewedAt: {
      type: Date,
      default: null
    },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    certificate: {
      type: companyCertificateSchema,
      default: () => ({})
    },
    verificationAnalysis: {
      type: verificationAnalysisSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
