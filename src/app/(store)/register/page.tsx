import { RegisterForm } from "@/components/store/AuthForms";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="container-x max-w-lg py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Retail customers and businesses (with GSTIN) both welcome.</p>
        <RegisterForm />
      </div>
    </div>
  );
}
