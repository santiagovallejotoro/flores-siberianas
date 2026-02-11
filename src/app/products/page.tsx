import ProductsHero from "@/components/Products/ProductsHero";
import ProductsFeatures from "@/components/Products/ProductsFeatures";
import ProductsGradesSection from "@/components/Products/ProductsGradesSection";
import ProductsPackaging from "@/components/Products/ProductsPackaging";
import ProductsTinted from "@/components/Products/ProductsTinted";
import ProductsColors from "@/components/Products/ProductsColors";
import ScrollUp from "@/components/Common/ScrollUp";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Flores Siberianas – Hydrangeas Grown in Colombia",
  description: "Hydrangeas grown in Colombia: grades, packaging, tinted and natural colors. Strong stems, uniform heads, extended vase life. Mini, Select, and Premium grades.",
};

const ProductsPage = () => {
  return (
    <>
      <ScrollUp />
      <ProductsHero />
      <ProductsFeatures />
      <ProductsGradesSection />
      <ProductsPackaging />
      <ProductsTinted />
      <ProductsColors />
    </>
  );
};

export default ProductsPage;
