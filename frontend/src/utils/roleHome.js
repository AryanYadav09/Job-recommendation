export const homeByUser = (user) => {
  if (!user) return "/login";
  if (user.role === "COMPANY") return "/company/dashboard";
  if (user.role === "ADMIN") return "/admin/verification";
  if (!user.onboardingCompleted) return "/onboarding";
  return "/dashboard";
};
