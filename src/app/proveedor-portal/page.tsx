import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal proveedor | Flores Siberianas",
  description: "Inicia sesión en el portal de proveedores de Flores Siberianas para acceder a tu cuenta y funciones avanzadas.",
};

const inputClass =
  "border-stroke text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-[#f8f8f8] px-6 py-3 text-base outline-none transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:shadow-none";

export default function ProveedorPortalPage() {
  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="shadow-three dark:bg-dark mx-auto max-w-[440px] rounded-xl bg-white px-6 py-10 sm:p-12">
              <h1 className="mb-2 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Portal proveedor
              </h1>
              <p className="text-body-color mb-8 text-center text-base">
                Inicia sesión para acceder a tu portal y a las herramientas de gestión avanzadas.
              </p>
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="proveedor-email"
                    className="text-dark mb-2 block text-sm font-medium dark:text-white"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="proveedor-email"
                    type="email"
                    name="email"
                    placeholder="tu@empresa.com"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="proveedor-password"
                    className="text-dark mb-2 block text-sm font-medium dark:text-white"
                  >
                    Contraseña
                  </label>
                  <input
                    id="proveedor-password"
                    type="password"
                    name="password"
                    placeholder="Ingresa tu contraseña"
                    className={inputClass}
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="text-body-color flex cursor-pointer items-center gap-2">
                    <input type="checkbox" name="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
                    Recordarme
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 w-full rounded-lg px-6 py-3.5 text-base font-semibold text-white shadow transition duration-300"
                >
                  Iniciar sesión
                </button>
              </form>
              <p className="text-body-color mt-6 text-center text-sm">
                ¿Necesitas acceso?{" "}
                <a
                  href={`https://wa.me/573127810890?text=${encodeURIComponent("Estoy interesado en ser proveedor y acceder a las herramientas de gestión avanzadas.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  Contáctanos
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
