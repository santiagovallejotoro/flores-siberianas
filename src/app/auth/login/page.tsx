import { redirect } from "next/navigation";

// Route has moved to /auth/clientes/login
export default function LoginRedirect() {
  redirect("/auth/clientes/login");
}
