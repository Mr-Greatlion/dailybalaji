import { LoginForm } from "@/components/store/AuthForms";

export const metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; admin?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container-x max-w-md py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{sp.admin ? "Admin login" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-gray-500">Login to track orders and checkout faster.</p>
        <LoginForm next={sp.next || (sp.admin ? "/admin" : "/account")} />
      </div>
    </div>
  );
}
