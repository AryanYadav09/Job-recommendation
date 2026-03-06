import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const AppShell = () => {
  return (
    <div className="app-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
