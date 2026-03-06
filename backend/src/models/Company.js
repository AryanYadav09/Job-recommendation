import mongoose from "mongoose";

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
    logoUrl: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
