import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="glass mx-auto max-w-xl p-8 text-center">
      <h1 className="font-display text-2xl">Page not found</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        The page you requested does not exist.
      </p>
      <Link className="btn-primary mt-5" to="/">
        Go home
      </Link>
    </div>
  );
};

export default NotFoundPage;
