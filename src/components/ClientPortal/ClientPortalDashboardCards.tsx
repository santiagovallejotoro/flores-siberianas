"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const OrdersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const DisponibilidadesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </svg>
);

const ShipmentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const EstadosDeCuentaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

export default function ClientPortalDashboardCards() {
  const { t } = useLanguage();
  const d = t.clientPortalDashboard;

  const cards = [
    {
      key: "orders",
      icon: <OrdersIcon />,
      title: d.orders.title,
      description: d.orders.description,
    },
    {
      key: "disponibilidades",
      icon: <DisponibilidadesIcon />,
      title: d.disponibilidades.title,
      description: d.disponibilidades.description,
    },
    {
      key: "shipments",
      icon: <ShipmentsIcon />,
      title: d.shipments.title,
      description: d.shipments.description,
    },
    {
      key: "estadosDeCuenta",
      icon: <EstadosDeCuentaIcon />,
      title: d.estadosDeCuenta.title,
      description: d.estadosDeCuenta.description,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-dark"
        >
          <div className="mb-4 inline-flex rounded-lg bg-primary-50 p-3 text-primary dark:bg-primary-500/10 dark:text-primary-300">
            {card.icon}
          </div>
          <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">
            {card.title}
          </h3>
          <p className="mb-3 text-sm text-body-color dark:text-body-color-dark">
            {card.description}
          </p>
          <span className="inline-block rounded-full bg-primary-50 px-3 py-0.5 text-xs font-medium text-primary dark:bg-primary-500/10 dark:text-primary-300">
            {d.comingSoon}
          </span>
        </div>
      ))}
    </div>
  );
}
