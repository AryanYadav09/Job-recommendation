export const parseTagsInput = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
};

export const formatRelativeTime = (iso) => {
  if (!iso) return "Recently added";

  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsed / (1000 * 60));

  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

export const formatJobType = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const toAbsoluteAssetUrl = (value = "") => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const origin = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
};

export const buildProfilePath = (role = "", id = "") => {
  const normalizedRole = String(role || "").toLowerCase();
  if (!id || !["user", "company"].includes(normalizedRole)) return "";
  return `/profiles/${normalizedRole}/${id}`;
};

export const formatFileSize = (value = 0) => {
  const size = Number(value) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatEnumLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
