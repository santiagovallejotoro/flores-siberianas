import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    id: 1,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36c-8.822 0-16-7.178-16-16S11.178 4 20 4s16 7.178 16 16-7.178 16-16 16z"
        />
        <path d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
        <circle cx="20" cy="20" r="4" />
      </svg>
    ),
    title: "Real-Time Inventory Control",
    paragraph:
      "Our digital inventory systems provide live availability data, enabling accurate planning and near-zero fulfillment errors.",
  },
  {
    id: 2,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M36 4H4c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4z"
        />
        <path d="M8 12h8v4H8v-4zm0 8h12v4H8v-4zm0 8h6v4H8v-4zm12-8h12v12H20V20zm0-8h12v4H20v-4z" />
      </svg>
    ),
    title: "Predictive Logistics",
    paragraph:
      "Using historical and real-time data, we optimize flight routes, export timing, and customs processes — reducing farm-to-door time for long-haul markets.",
  },
  {
    id: 3,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M36 0H4C1.8 0 0 1.8 0 4v32c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V4c0-2.2-1.8-4-4-4z"
        />
        <path d="M8 8h8v8H8V8zm12 0h12v4H20V8zm0 8h12v4H20v-4zM8 20h24v4H8v-4zm0 8h16v4H8v-4zm20 0h4v4h-4v-4z" />
      </svg>
    ),
    title: "Precision Quality Assurance",
    paragraph:
      "Every box is digitally logged and quality-checked. Our traceability system links each shipment back to its specific greenhouse plot.",
  },
];

export default featuresData;
