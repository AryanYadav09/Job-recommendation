import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="glass mx-auto max-w-xl p-8 text-center">
      <h1 className="font-display text-2xl">Unauthorized</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        You do not have permission to access this page.
      </p>
      <Link className="btn-primary mt-5" to="/">
        Back to home
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
