import { Outlet } from "react-router-dom";
import CallOverlay from "./CallOverlay";
import InboxDrawer from "./InboxDrawer";
import Navbar from "./Navbar";

const AppShell = () => {
  return (
    <div className="app-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-[88rem] px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
      <InboxDrawer />
      <CallOverlay />
    </div>
  );
};

export default AppShell;
