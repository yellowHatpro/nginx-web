import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="flex">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </section>
  );
};

export default Layout;
