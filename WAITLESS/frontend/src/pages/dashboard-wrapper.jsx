import { DashboardLayout } from "../layouts/DashboardLayout";

export default function DashboardWrapper() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-4 text-gray-600">Welcome to the WaitLess dashboard. The full dashboard component will be loaded here.</p>
      </div>
    </DashboardLayout>
  );
}