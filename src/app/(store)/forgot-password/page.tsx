import { ForgotForm } from "@/components/store/AuthForms";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <div className="container-x max-w-md py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-gray-500">We'll email you a 6-digit OTP.</p>
        <ForgotForm />
      </div>
    </div>
  );
}
