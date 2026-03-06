import { useEffect, useState } from "react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import Loader from "../components/Loader";
import { formatDate } from "../utils/format";

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    const [usersRes, companiesRes, jobsRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/companies"),
      api.get("/admin/jobs")
    ]);

    setUsers(usersRes.data);
    setCompanies(companiesRes.data);
    setJobs(jobsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage("User removed");
      fetchData().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove user");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job?")) return;

    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setMessage("Job removed");
      fetchData().catch(() => null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove job");
    }
  };

  if (loading) return <Loader />;

  return (
    <PageTransition>
      <section>
        <h1 className="font-display text-3xl">Admin Panel</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Monitor platform entities and remove fake or invalid entries.
        </p>

        {message ? (
          <p className="mt-4 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:text-sky-300">
            {message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6">
          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Users</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2">{formatDate(user.createdAt)}</td>
                    <td className="py-2">
                      {user.role !== "ADMIN" ? (
                        <button className="btn-secondary" onClick={() => handleDeleteUser(user._id)}>
                          Remove
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Companies</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Name</th>
                  <th className="py-2">Owner</th>
                  <th className="py-2">Industry</th>
                  <th className="py-2">Jobs</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{company.name}</td>
                    <td className="py-2">{company.owner?.name || "-"}</td>
                    <td className="py-2">{company.industry || "-"}</td>
                    <td className="py-2">{company.totalJobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass overflow-x-auto p-5">
            <h2 className="section-title">Jobs</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-2">Title</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2">{job.title}</td>
                    <td className="py-2">{job.company?.name || "-"}</td>
                    <td className="py-2">{job.type}</td>
                    <td className="py-2">{job.status}</td>
                    <td className="py-2">
                      <button className="btn-secondary" onClick={() => handleDeleteJob(job._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default AdminPanelPage;
