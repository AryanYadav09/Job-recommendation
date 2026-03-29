import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, MapPin, Wallet } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import PageTransition from "../components/PageTransition";

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isUser = useMemo(() => user?.role === "USER", [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/jobs/${jobId}`);
        setJob(data);

        if (isUser) {
          await api.post(`/jobs/${jobId}/view`);
          const profile = await api.get("/users/profile");
          const savedIds = (profile.data.savedJobs || []).map((item) => String(item._id));
          setSaved(savedIds.includes(jobId));
        }
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => setLoading(false));
  }, [jobId, isUser]);

  const onSave = async () => {
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSaved(data.saved);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save job");
    }
  };

  const onApply = async () => {
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setMessage("Application submitted");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not apply to job");
    }
  };

  if (loading) return <Loader />;
  if (!job)
    return (
      <div className="glass p-5 text-sm text-rose-500">
        Job not found.
      </div>
    );

  return (
    <PageTransition>
      <section className="glass p-6">
        <button className="btn-secondary mb-4" onClick={() => navigate(-1)}>
          Back
        </button>

        <h1 className="font-display text-3xl">{job.title}</h1>
        <p className="mt-2 inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <Building2 size={16} /> {job.company?.name}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1"><MapPin size={15} /> {job.location}</span>
          <span className="badge capitalize">{job.type}</span>
          <span className="badge">{job.category}</span>
          <span className="inline-flex items-center gap-1"><Wallet size={15} /> {job.salaryRange}</span>
        </div>

        <p className="mt-5 text-slate-700 dark:text-slate-200">{job.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(job.requiredSkills || []).map((skill) => (
            <span className="badge" key={skill}>{skill}</span>
          ))}
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        {isUser ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={onSave}>{saved ? "Saved" : "Save Job"}</button>
            <button className="btn-primary" onClick={onApply}>Apply Now</button>
          </div>
        ) : null}
      </section>
    </PageTransition>
  );
};

export default JobDetailsPage;
