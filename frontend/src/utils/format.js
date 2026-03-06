export const parseTagsInput = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
};
