import { useEffect, useState } from "react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";

const CompanyProfilePage = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    location: "",
    industry: "",
    size: "",
    logoUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/company/profile")
      .then(({ data }) => {
        setForm({
          name: data.name || "",
          description: data.description || "",
          website: data.website || "",
          location: data.location || "",
          industry: data.industry || "",
          size: data.size || "",
          logoUrl: data.logoUrl || ""
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/company/profile", form);
      setMessage("Company profile updated");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update");
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <form className="glass mx-auto max-w-3xl p-6" onSubmit={handleSubmit}>
        <h1 className="section-title">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Keep your company details updated for better applicant trust.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="input md:col-span-2"
            placeholder="Company name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <textarea
            className="input md:col-span-2 min-h-28"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Website"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Industry"
            value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Size (e.g., 51-200)"
            value={form.size}
            onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
          />
          <input
            className="input md:col-span-2"
            placeholder="Logo URL"
            value={form.logoUrl}
            onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
          />
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        <button className="btn-primary mt-5">Save Company Profile</button>
      </form>
    </PageTransition>
  );
};

export default CompanyProfilePage;
