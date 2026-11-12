import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Components/SideBar";

export default function MainLayout() {
  return (
    <div className="min-h-screen lg:pl-61">
  <Sidebar />
  <main className="min-h-screen pb-14 lg:pb-0">
    <Outlet />
  </main>
</div>
  );
}
