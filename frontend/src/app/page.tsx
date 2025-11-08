import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import TopNavigation from "@/components/client/TopNavigation";
import HeroCarousel from "@/components/client/HeroCarousel";
import PromotionalDeals from "@/components/client/PromotionalDeals";
import ProductTabs from "@/components/client/ProductTabs";
import NewsletterSignup from "@/components/client/NewsletterSignup";
import { getProducts } from "@/lib/apis/client/products";
import type { ClientProduct } from "@/types/client";

export const metadata = {
  title: "Home",
  description: "Welcome to our ecommerce store",
};

async function getFeaturedProducts(): Promise<ClientProduct[]> {
  try {
    const response = await getProducts({ featured: true, per_page: 5 });
    return response.data;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <TopNavigation />
      
      {/* Hero Carousel */}
      {featuredProducts.length > 0 && (
        <HeroCarousel products={featuredProducts} />
      )}

      {/* Full Width Sections */}
      <PromotionalDeals />
      <ProductTabs />
      <NewsletterSignup />

      <Footer />
    </div>
  );
}
