import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { clearAppCollections } from "./resetDatabase.js";

dotenv.config();

const ACTION_WEIGHTS = {
  view: 1,
  save: 3,
  apply: 5
};

const levels = [
  { label: "Intern", bumpMin: -30, bumpMax: -20 },
  { label: "Junior", bumpMin: -10, bumpMax: -5 },
  { label: "Mid", bumpMin: 0, bumpMax: 5 },
  { label: "Senior", bumpMin: 20, bumpMax: 25 },
  { label: "Lead", bumpMin: 35, bumpMax: 45 }
];

const templates = [
  {
    title: "Frontend Engineer",
    category: "Frontend",
    skills: ["react", "javascript", "typescript", "tailwind"],
    bonusSkills: ["redux", "next.js", "accessibility", "jest", "framer-motion"],
    locations: ["Remote", "San Francisco, CA", "Austin, TX"],
    types: ["remote", "full-time", "hybrid"],
    baseSalaryMin: 90,
    baseSalaryMax: 125,
    description:
      "Build performant, accessible interfaces and ship polished product experiences."
  },
  {
    title: "Backend Engineer",
    category: "Backend",
    skills: ["node.js", "express", "mongodb", "redis"],
    bonusSkills: ["grpc", "kafka", "postgresql", "docker", "graphql"],
    locations: ["New York, NY", "Remote", "Seattle, WA"],
    types: ["full-time", "remote", "hybrid"],
    baseSalaryMin: 105,
    baseSalaryMax: 145,
    description:
      "Design APIs, optimize services, and improve reliability across distributed systems."
  },
  {
    title: "Full Stack Developer",
    category: "Fullstack",
    skills: ["react", "node.js", "mongodb", "typescript"],
    bonusSkills: ["next.js", "postgresql", "graphql", "docker", "aws"],
    locations: ["Remote", "Denver, CO", "Chicago, IL"],
    types: ["hybrid", "remote", "full-time"],
    baseSalaryMin: 100,
    baseSalaryMax: 140,
    description:
      "Own features end-to-end, from product UI to backend services and deployment."
  },
  {
    title: "Data Scientist",
    category: "Data Science",
    skills: ["python", "sql", "pandas", "machine learning"],
    bonusSkills: ["pytorch", "tensorflow", "airflow", "numpy", "tableau"],
    locations: ["Boston, MA", "Remote", "San Diego, CA"],
    types: ["full-time", "remote", "hybrid"],
    baseSalaryMin: 110,
    baseSalaryMax: 150,
    description:
      "Analyze behavioral data and build predictive models to improve product outcomes."
  },
  {
    title: "DevOps Engineer",
    category: "DevOps",
    skills: ["aws", "docker", "kubernetes", "terraform"],
    bonusSkills: ["ansible", "ci/cd", "prometheus", "grafana", "linux"],
    locations: ["Remote", "Dallas, TX", "New York, NY"],
    types: ["full-time", "remote", "hybrid"],
    baseSalaryMin: 115,
    baseSalaryMax: 155,
    description:
      "Automate infrastructure, increase release velocity, and improve platform resilience."
  },
  {
    title: "Mobile Engineer",
    category: "Mobile",
    skills: ["react native", "javascript", "typescript", "mobile ui"],
    bonusSkills: ["android", "ios", "expo", "firebase", "redux"],
    locations: ["Austin, TX", "Remote", "Miami, FL"],
    types: ["full-time", "hybrid", "remote"],
    baseSalaryMin: 95,
    baseSalaryMax: 135,
    description:
      "Ship high quality mobile experiences with strong performance and clean architecture."
  },
  {
    title: "Cybersecurity Analyst",
    category: "Cybersecurity",
    skills: ["network security", "siem", "incident response", "python"],
    bonusSkills: ["threat modeling", "soc", "penetration testing", "splunk", "cloud security"],
    locations: ["Washington, DC", "Remote", "Atlanta, GA"],
    types: ["full-time", "hybrid", "remote"],
    baseSalaryMin: 100,
    baseSalaryMax: 145,
    description:
      "Detect threats, secure infrastructure, and reduce organizational security risk."
  },
  {
    title: "Product Manager",
    category: "Product Management",
    skills: ["roadmapping", "analytics", "stakeholder management", "agile"],
    bonusSkills: ["a/b testing", "sql", "jira", "market research", "funnel analysis"],
    locations: ["San Francisco, CA", "Remote", "Chicago, IL"],
    types: ["full-time", "hybrid", "remote"],
    baseSalaryMin: 115,
    baseSalaryMax: 160,
    description:
      "Define product strategy, prioritize roadmap, and partner with cross-functional teams."
  },
  {
    title: "UI/UX Designer",
    category: "Design",
    skills: ["figma", "interaction design", "ux research", "design systems"],
    bonusSkills: ["prototyping", "wireframing", "accessibility", "motion design", "usability testing"],
    locations: ["Remote", "Los Angeles, CA", "Seattle, WA"],
    types: ["remote", "full-time", "hybrid"],
    baseSalaryMin: 90,
    baseSalaryMax: 130,
    description:
      "Craft intuitive interfaces and scalable design systems for modern digital products."
  },
  {
    title: "QA Automation Engineer",
    category: "Quality Assurance",
    skills: ["selenium", "playwright", "api testing", "javascript"],
    bonusSkills: ["cypress", "postman", "test strategy", "ci/cd", "performance testing"],
    locations: ["Phoenix, AZ", "Remote", "New York, NY"],
    types: ["full-time", "remote", "hybrid"],
    baseSalaryMin: 85,
    baseSalaryMax: 120,
    description:
      "Build reliable test automation frameworks and increase release confidence."
  }
];

const verificationFields = {
  verificationStatus: "VERIFIED",
  verificationSubmittedAt: new Date(),
  verificationReviewedAt: new Date(),
  verificationNotes: "Seeded demo company",
  verificationAnalysis: {
    analysisStatus: "COMPLETED",
    extractor: "seed-data",
    analyzedAt: new Date(),
    extractedTextPreview: "Seeded demo verification data.",
    extractedTextLength: 28,
    authenticityScore: 100,
    recommendation: "HIGH_CONFIDENCE",
    matchedSignals: ["Seeded verified company"],
    riskFlags: [],
    extractedRegistrationNumbers: [],
    registryValidation: {
      provider: "",
      status: "SKIPPED",
      checkedAt: null,
      message: "Seed data",
      matchedName: false,
      matchedCompanyNumber: false,
      jurisdictionCode: "",
      companyNumber: "",
      companyStatus: "",
      registryUrl: "",
      source: ""
    },
    errorMessage: ""
  }
};

const seed = async () => {
  await connectDB();
  await clearAppCollections();

  const admin = await User.create({
    name: "Admin Root",
    email: "admin@smartjobs.dev",
    password: "admin123",
    role: "ADMIN",
    skills: ["moderation", "operations"],
    interests: ["platform management"],
    experienceLevel: "SENIOR",
    location: "Austin, TX",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const companyUserA = await User.create({
    name: "Nexa Labs HR",
    email: "hr@nexalabs.com",
    password: "company123",
    role: "COMPANY",
    location: "San Francisco, CA",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const companyUserB = await User.create({
    name: "Orbit Systems Talent",
    email: "talent@orbitsystems.com",
    password: "company123",
    role: "COMPANY",
    location: "New York, NY",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const companyUserC = await User.create({
    name: "Vertex Dynamics Hiring",
    email: "jobs@vertexdynamics.com",
    password: "company123",
    role: "COMPANY",
    location: "Seattle, WA",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const companyA = await Company.create({
    owner: companyUserA._id,
    name: "Nexa Labs",
    description: "Product engineering studio shipping AI-first SaaS",
    website: "https://nexalabs.example",
    location: "San Francisco, CA",
    industry: "Software",
    size: "51-200",
    businessEmail: companyUserA.email,
    registrationNumber: "NEXA-001",
    ...verificationFields
  });

  const companyB = await Company.create({
    owner: companyUserB._id,
    name: "Orbit Systems",
    description: "Cloud and data infrastructure company",
    website: "https://orbitsystems.example",
    location: "New York, NY",
    industry: "Cloud Infrastructure",
    size: "201-500",
    businessEmail: companyUserB.email,
    registrationNumber: "ORBIT-001",
    ...verificationFields
  });

  const companyC = await Company.create({
    owner: companyUserC._id,
    name: "Vertex Dynamics",
    description: "Enterprise platform and cybersecurity solutions",
    website: "https://vertexdynamics.example",
    location: "Seattle, WA",
    industry: "Enterprise Software",
    size: "501-1000",
    businessEmail: companyUserC.email,
    registrationNumber: "VERTEX-001",
    ...verificationFields
  });

  companyUserA.company = companyA._id;
  companyUserB.company = companyB._id;
  companyUserC.company = companyC._id;
  await companyUserA.save();
  await companyUserB.save();
  await companyUserC.save();

  const userA = await User.create({
    name: "Arya Frontend",
    email: "arya@example.com",
    password: "user12345",
    role: "USER",
    skills: ["react", "javascript", "tailwind", "typescript"],
    interests: ["frontend", "ui engineering"],
    experienceLevel: "MID",
    preferredCategory: "Frontend",
    desiredRoles: ["Frontend Engineer", "UI Engineer"],
    desiredJobTypes: ["remote", "hybrid"],
    preferredLocations: ["Remote", "San Francisco, CA"],
    expectedSalaryMin: 95000,
    expectedSalaryMax: 145000,
    location: "Remote",
    experienceSummary:
      "Frontend engineer with 4+ years building React product interfaces, design systems, and performance-focused UI workflows.",
    resumeUrl: "https://example.com/resumes/arya-frontend.pdf",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const userB = await User.create({
    name: "Ravi Backend",
    email: "ravi@example.com",
    password: "user12345",
    role: "USER",
    skills: ["node.js", "mongodb", "docker", "express"],
    interests: ["backend", "platform"],
    experienceLevel: "MID",
    preferredCategory: "Backend",
    desiredRoles: ["Backend Engineer", "Platform Engineer"],
    desiredJobTypes: ["full-time", "remote"],
    preferredLocations: ["New York, NY", "Remote"],
    expectedSalaryMin: 105000,
    expectedSalaryMax: 155000,
    location: "New York, NY",
    experienceSummary:
      "Backend engineer focused on APIs, data modeling, and containerized services for high-traffic applications.",
    resumeUrl: "https://example.com/resumes/ravi-backend.pdf",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const userC = await User.create({
    name: "Mina Fullstack",
    email: "mina@example.com",
    password: "user12345",
    role: "USER",
    skills: ["react", "node.js", "mongodb", "aws"],
    interests: ["fullstack", "product"],
    experienceLevel: "JUNIOR",
    preferredCategory: "Fullstack",
    desiredRoles: ["Full Stack Developer", "Product Engineer"],
    desiredJobTypes: ["hybrid", "remote"],
    preferredLocations: ["San Francisco, CA", "Remote"],
    expectedSalaryMin: 85000,
    expectedSalaryMax: 130000,
    location: "San Francisco, CA",
    experienceSummary:
      "Full stack developer shipping user-facing features across React frontends and Node-based backend services.",
    resumeUrl: "https://example.com/resumes/mina-fullstack.pdf",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const userD = await User.create({
    name: "Sara Design",
    email: "sara@example.com",
    password: "user12345",
    role: "USER",
    skills: ["figma", "design systems", "interaction design", "prototyping"],
    interests: ["ux", "product design"],
    experienceLevel: "MID",
    preferredCategory: "Design",
    desiredRoles: ["UI/UX Designer", "Product Designer"],
    desiredJobTypes: ["remote", "full-time"],
    preferredLocations: ["Remote", "Los Angeles, CA"],
    expectedSalaryMin: 90000,
    expectedSalaryMax: 135000,
    location: "Remote",
    experienceSummary:
      "Product designer working across research, prototyping, and scalable design systems for web products.",
    resumeUrl: "https://example.com/resumes/sara-design.pdf",
    onboardingCompleted: true,
    isEmailVerified: true
  });

  const companyRefs = [
    { companyId: companyA._id, postedBy: companyUserA._id },
    { companyId: companyB._id, postedBy: companyUserB._id },
    { companyId: companyC._id, postedBy: companyUserC._id }
  ];

  const generatedJobs = [];

  templates.forEach((template, templateIndex) => {
    levels.forEach((level, levelIndex) => {
      const owner = companyRefs[(templateIndex + levelIndex) % companyRefs.length];
      const salaryMin = Math.max(template.baseSalaryMin + level.bumpMin, 15);
      const salaryMax = Math.max(template.baseSalaryMax + level.bumpMax, salaryMin + 10);
      const bonusSkill = template.bonusSkills[levelIndex % template.bonusSkills.length];

      generatedJobs.push({
        title: `${level.label} ${template.title}`,
        description: `${template.description} This role focuses on ${template.category.toLowerCase()} delivery with strong collaboration across product, design, and engineering teams.`,
        requiredSkills: Array.from(new Set([...template.skills, bonusSkill])).slice(0, 5),
        category: template.category,
        location: template.locations[levelIndex % template.locations.length],
        type: template.types[levelIndex % template.types.length],
        salaryMin: salaryMin * 1000,
        salaryMax: salaryMax * 1000,
        salaryRange: `$${salaryMin}k-$${salaryMax}k`,
        company: owner.companyId,
        postedBy: owner.postedBy
      });
    });
  });

  const additionalTestJobs = [
    {
      title: "Senior ML Engineer",
      description: "Lead machine learning initiatives and build scalable models for production systems.",
      requiredSkills: ["python", "tensorflow", "pytorch", "machine learning", "aws"],
      category: "Data Science",
      location: "Remote",
      type: "full-time",
      salaryMin: 150000,
      salaryMax: 190000,
      salaryRange: "$150k-$190k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "React Native Developer",
      description: "Build cross-platform mobile applications with React Native and Expo.",
      requiredSkills: ["react native", "javascript", "typescript", "firebase", "react"],
      category: "Mobile",
      location: "Austin, TX",
      type: "hybrid",
      salaryMin: 105000,
      salaryMax: 140000,
      salaryRange: "$105k-$140k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "Infrastructure Engineer",
      description: "Design and maintain cloud infrastructure using Terraform and Kubernetes.",
      requiredSkills: ["kubernetes", "terraform", "aws", "devops", "docker"],
      category: "DevOps",
      location: "New York, NY",
      type: "remote",
      salaryMin: 125000,
      salaryMax: 165000,
      salaryRange: "$125k-$165k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "Security Engineer",
      description: "Protect applications and infrastructure from security threats and vulnerabilities.",
      requiredSkills: ["network security", "python", "siem", "cloud security", "linux"],
      category: "Cybersecurity",
      location: "Washington, DC",
      type: "full-time",
      salaryMin: 130000,
      salaryMax: 170000,
      salaryRange: "$130k-$170k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "Vue.js Developer",
      description: "Build dynamic single-page applications using Vue.js and modern tooling.",
      requiredSkills: ["vue.js", "javascript", "typescript", "scss", "webpack"],
      category: "Frontend",
      location: "Remote",
      type: "remote",
      salaryMin: 88000,
      salaryMax: 128000,
      salaryRange: "$88k-$128k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "PostgreSQL Database Administrator",
      description: "Manage, optimize, and maintain PostgreSQL databases for high-traffic applications.",
      requiredSkills: ["postgresql", "sql", "database optimization", "linux", "bash"],
      category: "Backend",
      location: "Seattle, WA",
      type: "hybrid",
      salaryMin: 110000,
      salaryMax: 150000,
      salaryRange: "$110k-$150k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "Product Designer",
      description: "Lead design initiatives and create compelling user experiences for web and mobile.",
      requiredSkills: ["figma", "ux research", "interaction design", "prototyping", "user testing"],
      category: "Design",
      location: "San Francisco, CA",
      type: "full-time",
      salaryMin: 105000,
      salaryMax: 145000,
      salaryRange: "$105k-$145k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "Python Backend Developer",
      description: "Build robust APIs and backend services using Python and modern frameworks.",
      requiredSkills: ["python", "fastapi", "postgresql", "redis", "docker"],
      category: "Backend",
      location: "Remote",
      type: "remote",
      salaryMin: 100000,
      salaryMax: 140000,
      salaryRange: "$100k-$140k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "Analytics Engineer",
      description: "Transform raw data into actionable insights using SQL and modern analytics tools.",
      requiredSkills: ["sql", "analytics", "dbt", "tableau", "python"],
      category: "Data Science",
      location: "Boston, MA",
      type: "hybrid",
      salaryMin: 100000,
      salaryMax: 140000,
      salaryRange: "$100k-$140k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "Performance Engineer",
      description: "Optimize application performance and identify bottlenecks in production systems.",
      requiredSkills: ["javascript", "performance optimization", "profiling", "node.js", "react"],
      category: "Frontend",
      location: "Austin, TX",
      type: "full-time",
      salaryMin: 110000,
      salaryMax: 150000,
      salaryRange: "$110k-$150k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "iOS Developer",
      description: "Create native iOS applications with Swift and deliver exceptional mobile experiences.",
      requiredSkills: ["swift", "ios", "objective-c", "xcode", "swiftui"],
      category: "Mobile",
      location: "San Jose, CA",
      type: "hybrid",
      salaryMin: 115000,
      salaryMax: 155000,
      salaryRange: "$115k-$155k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "GraphQL API Developer",
      description: "Design and implement GraphQL APIs for modern web and mobile applications.",
      requiredSkills: ["graphql", "node.js", "typescript", "apollo", "mongodb"],
      category: "Backend",
      location: "Denver, CO",
      type: "hybrid",
      salaryMin: 105000,
      salaryMax: 145000,
      salaryRange: "$105k-$145k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "Design Systems Lead",
      description: "Lead the development of comprehensive design systems for consistent product experiences.",
      requiredSkills: ["figma", "design systems", "component design", "documentation", "accessibility"],
      category: "Design",
      location: "Remote",
      type: "remote",
      salaryMin: 120000,
      salaryMax: 160000,
      salaryRange: "$120k-$160k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "Cloud Architect",
      description: "Design scalable cloud solutions and lead infrastructure initiatives.",
      requiredSkills: ["aws", "azure", "architecture design", "terraform", "kubernetes"],
      category: "DevOps",
      location: "Chicago, IL",
      type: "remote",
      salaryMin: 140000,
      salaryMax: 180000,
      salaryRange: "$140k-$180k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "Go Developer",
      description: "Build high-performance systems and microservices using Go.",
      requiredSkills: ["go", "microservices", "concurrent programming", "docker", "kubernetes"],
      category: "Backend",
      location: "Remote",
      type: "full-time",
      salaryMin: 115000,
      salaryMax: 155000,
      salaryRange: "$115k-$155k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "Incident Response Specialist",
      description: "Lead incident response efforts and improve system reliability and security.",
      requiredSkills: ["incident management", "siem", "security analysis", "linux", "networking"],
      category: "Cybersecurity",
      location: "Atlanta, GA",
      type: "hybrid",
      salaryMin: 105000,
      salaryMax: 145000,
      salaryRange: "$105k-$145k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "Angular Developer",
      description: "Build enterprise web applications with Angular and TypeScript.",
      requiredSkills: ["angular", "typescript", "rxjs", "material design", "web components"],
      category: "Frontend",
      location: "Boston, MA",
      type: "hybrid",
      salaryMin: 100000,
      salaryMax: 140000,
      salaryRange: "$100k-$140k",
      company: companyB._id,
      postedBy: companyUserB._id
    },
    {
      title: "Data Pipeline Engineer",
      description: "Build and maintain data pipelines and ETL processes for analytics.",
      requiredSkills: ["python", "apache airflow", "sql", "spark", "aws"],
      category: "Data Science",
      location: "San Diego, CA",
      type: "remote",
      salaryMin: 110000,
      salaryMax: 150000,
      salaryRange: "$110k-$150k",
      company: companyC._id,
      postedBy: companyUserC._id
    },
    {
      title: "QA Lead",
      description: "Lead quality assurance efforts and build robust testing frameworks.",
      requiredSkills: ["test automation", "pytest", "selenium", "test strategy", "ci/cd"],
      category: "Quality Assurance",
      location: "Miami, FL",
      type: "full-time",
      salaryMin: 100000,
      salaryMax: 140000,
      salaryRange: "$100k-$140k",
      company: companyA._id,
      postedBy: companyUserA._id
    },
    {
      title: "Svelte Developer",
      description: "Build fast and interactive web applications using Svelte framework.",
      requiredSkills: ["svelte", "javascript", "sveltekit", "scss", "rollup"],
      category: "Frontend",
      location: "Portland, OR",
      type: "remote",
      salaryMin: 95000,
      salaryMax: 135000,
      salaryRange: "$95k-$135k",
      company: companyB._id,
      postedBy: companyUserB._id
    }
  ];

  generatedJobs.push(...additionalTestJobs);

  const jobs = await Job.insertMany(generatedJobs);

  const getJobByCategory = (category, index = 0) => {
    const matched = jobs.filter((job) => job.category === category);
    return matched[index] || matched[0] || jobs[0];
  };

  const frontendJob = getJobByCategory("Frontend", 2);
  const fullstackJob = getJobByCategory("Fullstack", 1);
  const backendJob = getJobByCategory("Backend", 3);
  const designJob = getJobByCategory("Design", 2);
  const devopsJob = getJobByCategory("DevOps", 1);
  const mobileJob = getJobByCategory("Mobile", 2);
  const dataScienceJob = getJobByCategory("Data Science", 1);
  const cybersecurityJob = getJobByCategory("Cybersecurity", 1);

  userA.savedJobs = [frontendJob._id, fullstackJob._id, designJob._id];
  userB.savedJobs = [backendJob._id, devopsJob._id];
  userC.savedJobs = [fullstackJob._id, mobileJob._id];
  await userA.save();
  await userB.save();
  await userC.save();

  await UserAction.insertMany([
    { user: userA._id, job: frontendJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },
    { user: userA._id, job: frontendJob._id, actionType: "save", weight: ACTION_WEIGHTS.save },
    { user: userA._id, job: fullstackJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },
    { user: userA._id, job: fullstackJob._id, actionType: "apply", weight: ACTION_WEIGHTS.apply },
    { user: userA._id, job: designJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },

    { user: userB._id, job: backendJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },
    { user: userB._id, job: backendJob._id, actionType: "apply", weight: ACTION_WEIGHTS.apply },
    { user: userB._id, job: devopsJob._id, actionType: "save", weight: ACTION_WEIGHTS.save },
    { user: userB._id, job: cybersecurityJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },

    { user: userC._id, job: fullstackJob._id, actionType: "apply", weight: ACTION_WEIGHTS.apply },
    { user: userC._id, job: mobileJob._id, actionType: "view", weight: ACTION_WEIGHTS.view },
    { user: userC._id, job: dataScienceJob._id, actionType: "save", weight: ACTION_WEIGHTS.save },

    { user: userD._id, job: designJob._id, actionType: "apply", weight: ACTION_WEIGHTS.apply },
    { user: userD._id, job: frontendJob._id, actionType: "view", weight: ACTION_WEIGHTS.view }
  ]);

  await Application.insertMany([
    {
      user: userA._id,
      job: fullstackJob._id,
      company: fullstackJob.company,
      status: "submitted",
      resumeUrl: userA.resumeUrl
    },
    {
      user: userB._id,
      job: backendJob._id,
      company: backendJob.company,
      status: "reviewing",
      resumeUrl: userB.resumeUrl
    },
    {
      user: userC._id,
      job: fullstackJob._id,
      company: fullstackJob.company,
      status: "submitted",
      resumeUrl: userC.resumeUrl
    },
    {
      user: userD._id,
      job: designJob._id,
      company: designJob.company,
      status: "shortlisted",
      resumeUrl: userD.resumeUrl
    }
  ]);

  const firstConversationReadAt = new Date();
  const firstConversationDeliveredAt = new Date(firstConversationReadAt.getTime() - 1000 * 60);
  const firstConversationFirstMessageAt = new Date(firstConversationReadAt.getTime() - 1000 * 60 * 60);
  const firstConversationLastMessageAt = new Date(firstConversationReadAt.getTime() - 1000 * 15);
  const thirdConversationFirstMessageAt = new Date(firstConversationReadAt.getTime() - 1000 * 60 * 60 * 2);
  const thirdConversationLastMessageAt = new Date(firstConversationReadAt.getTime() - 1000 * 90);

  const userAppliedConversation = await Conversation.create({
    user: userA._id,
    company: fullstackJob.company,
    initiatedBy: userA._id,
    initiatedByRole: "USER",
    unreadCounts: {
      user: 1,
      company: 0
    },
    lastMessage: {
      text: "Thanks for applying. Are you available for a quick intro call tomorrow?",
      senderId: fullstackJob.company,
      senderRole: "COMPANY",
      createdAt: firstConversationLastMessageAt
    },
    lastMessageAt: firstConversationLastMessageAt,
    createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 60 * 60 * 5),
    updatedAt: firstConversationLastMessageAt
  });

  const companyInitiatedConversation = await Conversation.create({
    user: userC._id,
    company: companyA._id,
    initiatedBy: companyA._id,
    initiatedByRole: "COMPANY",
    unreadCounts: {
      user: 0,
      company: 0
    },
    lastMessage: {
      text: "Yes, I am interested. Happy to share more about my recent projects.",
      senderId: userC._id,
      senderRole: "USER",
      createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 5)
    },
    lastMessageAt: new Date(firstConversationReadAt.getTime() - 1000 * 5),
    createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(firstConversationReadAt.getTime() - 1000 * 5)
  });

  const pendingReplyConversation = await Conversation.create({
    user: userB._id,
    company: backendJob.company,
    initiatedBy: backendJob.company,
    initiatedByRole: "COMPANY",
    unreadCounts: {
      user: 0,
      company: 1
    },
    lastMessage: {
      text: "Yes, I can share details about my recent API and database work.",
      senderId: userB._id,
      senderRole: "USER",
      createdAt: thirdConversationLastMessageAt
    },
    lastMessageAt: thirdConversationLastMessageAt,
    createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 60 * 60 * 10),
    updatedAt: thirdConversationLastMessageAt
  });

  await Message.insertMany([
    {
      conversation: userAppliedConversation._id,
      senderId: userA._id,
      senderRole: "USER",
      receiverId: fullstackJob.company,
      receiverRole: "COMPANY",
      messageText: "Hi, I applied earlier today and wanted to confirm you received my application.",
      status: "read",
      deliveredAt: firstConversationDeliveredAt,
      readAt: firstConversationReadAt,
      createdAt: firstConversationFirstMessageAt,
      updatedAt: firstConversationReadAt
    },
    {
      conversation: userAppliedConversation._id,
      senderId: fullstackJob.company,
      senderRole: "COMPANY",
      receiverId: userA._id,
      receiverRole: "USER",
      messageText: "Thanks for applying. Are you available for a quick intro call tomorrow?",
      status: "delivered",
      deliveredAt: new Date(firstConversationLastMessageAt.getTime() + 1000 * 20),
      readAt: null,
      createdAt: firstConversationLastMessageAt,
      updatedAt: new Date(firstConversationLastMessageAt.getTime() + 1000 * 20)
    },
    {
      conversation: companyInitiatedConversation._id,
      senderId: companyA._id,
      senderRole: "COMPANY",
      receiverId: userC._id,
      receiverRole: "USER",
      messageText: "Your profile looks relevant for one of our product engineering roles. Open to a conversation?",
      status: "read",
      deliveredAt: new Date(firstConversationReadAt.getTime() - 1000 * 25),
      readAt: new Date(firstConversationReadAt.getTime() - 1000 * 10),
      createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 40),
      updatedAt: new Date(firstConversationReadAt.getTime() - 1000 * 10)
    },
    {
      conversation: companyInitiatedConversation._id,
      senderId: userC._id,
      senderRole: "USER",
      receiverId: companyA._id,
      receiverRole: "COMPANY",
      messageText: "Yes, I am interested. Happy to share more about my recent projects.",
      status: "read",
      deliveredAt: new Date(firstConversationReadAt.getTime() - 1000 * 4),
      readAt: new Date(firstConversationReadAt.getTime() - 1000 * 2),
      createdAt: new Date(firstConversationReadAt.getTime() - 1000 * 5),
      updatedAt: new Date(firstConversationReadAt.getTime() - 1000 * 2)
    },
    {
      conversation: pendingReplyConversation._id,
      senderId: backendJob.company,
      senderRole: "COMPANY",
      receiverId: userB._id,
      receiverRole: "USER",
      messageText: "We are reviewing your backend application now. Can you walk us through a recent scaling challenge you handled?",
      status: "read",
      deliveredAt: new Date(thirdConversationFirstMessageAt.getTime() + 1000 * 15),
      readAt: new Date(thirdConversationFirstMessageAt.getTime() + 1000 * 45),
      createdAt: thirdConversationFirstMessageAt,
      updatedAt: new Date(thirdConversationFirstMessageAt.getTime() + 1000 * 45)
    },
    {
      conversation: pendingReplyConversation._id,
      senderId: userB._id,
      senderRole: "USER",
      receiverId: backendJob.company,
      receiverRole: "COMPANY",
      messageText: "Yes, I can share details about my recent API and database work.",
      status: "sent",
      deliveredAt: null,
      readAt: null,
      createdAt: thirdConversationLastMessageAt,
      updatedAt: thirdConversationLastMessageAt
    }
  ]);

  console.log("Seed completed successfully");
  console.log(`Inserted jobs: ${jobs.length}`);
  console.log("Seeded demo conversations:");
  console.table([
    {
      thread: "User applied to company",
      user: userA.email,
      company: fullstackJob.company.toString(),
      lastStatus: "delivered"
    },
    {
      thread: "Company initiated outreach",
      user: userC.email,
      company: companyA._id.toString(),
      lastStatus: "read"
    },
    {
      thread: "Pending recruiter reply",
      user: userB.email,
      company: backendJob.company.toString(),
      lastStatus: "sent"
    }
  ]);
  console.table([
    { role: "ADMIN", email: admin.email, password: "admin123" },
    { role: "COMPANY", email: companyUserA.email, password: "company123" },
    { role: "COMPANY", email: companyUserB.email, password: "company123" },
    { role: "COMPANY", email: companyUserC.email, password: "company123" },
    { role: "USER", email: userA.email, password: "user12345" },
    { role: "USER", email: userB.email, password: "user12345" },
    { role: "USER", email: userC.email, password: "user12345" },
    { role: "USER", email: userD.email, password: "user12345" }
  ]);

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
