import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";

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

const seed = async () => {
  await connectDB();

  await Promise.all([
    Application.deleteMany({}),
    UserAction.deleteMany({}),
    Job.deleteMany({}),
    Company.deleteMany({}),
    User.deleteMany({})
  ]);

  const admin = await User.create({
    name: "Admin Root",
    email: "admin@smartjobs.dev",
    password: "admin123",
    role: "ADMIN",
    skills: ["moderation", "operations"],
    interests: ["platform management"],
    experienceLevel: "SENIOR",
    location: "Austin, TX",
    onboardingCompleted: true
  });

  const companyUserA = await User.create({
    name: "Nexa Labs HR",
    email: "hr@nexalabs.com",
    password: "company123",
    role: "COMPANY",
    location: "San Francisco, CA",
    onboardingCompleted: true
  });

  const companyUserB = await User.create({
    name: "Orbit Systems Talent",
    email: "talent@orbitsystems.com",
    password: "company123",
    role: "COMPANY",
    location: "New York, NY",
    onboardingCompleted: true
  });

  const companyUserC = await User.create({
    name: "Vertex Dynamics Hiring",
    email: "jobs@vertexdynamics.com",
    password: "company123",
    role: "COMPANY",
    location: "Seattle, WA",
    onboardingCompleted: true
  });

  const companyA = await Company.create({
    owner: companyUserA._id,
    name: "Nexa Labs",
    description: "Product engineering studio shipping AI-first SaaS",
    website: "https://nexalabs.example",
    location: "San Francisco, CA",
    industry: "Software",
    size: "51-200"
  });

  const companyB = await Company.create({
    owner: companyUserB._id,
    name: "Orbit Systems",
    description: "Cloud and data infrastructure company",
    website: "https://orbitsystems.example",
    location: "New York, NY",
    industry: "Cloud Infrastructure",
    size: "201-500"
  });

  const companyC = await Company.create({
    owner: companyUserC._id,
    name: "Vertex Dynamics",
    description: "Enterprise platform and cybersecurity solutions",
    website: "https://vertexdynamics.example",
    location: "Seattle, WA",
    industry: "Enterprise Software",
    size: "501-1000"
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
    onboardingCompleted: true
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
    onboardingCompleted: true
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
    onboardingCompleted: true
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
    onboardingCompleted: true
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
      status: "submitted"
    },
    {
      user: userB._id,
      job: backendJob._id,
      company: backendJob.company,
      status: "reviewing"
    },
    {
      user: userC._id,
      job: fullstackJob._id,
      company: fullstackJob.company,
      status: "submitted"
    },
    {
      user: userD._id,
      job: designJob._id,
      company: designJob.company,
      status: "shortlisted"
    }
  ]);

  console.log("Seed completed successfully");
  console.log(`Inserted jobs: ${jobs.length}`);
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
