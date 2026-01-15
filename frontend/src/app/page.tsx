import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import TopNavigation from "@/components/client/TopNavigation";
import HeroCarousel from "@/components/client/HeroCarousel";
import PromotionalDeals from "@/components/client/PromotionalDeals";
import ProductTabs from "@/components/client/ProductTabs";
import UpcomingProducts from "@/components/client/UpcomingProducts";
import LazyLoadProducts from "@/components/client/LazyLoadProducts";

export const metadata = {
  title: "Home",
  description: "Welcome to our ecommerce store",
};

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <TopNavigation />

      {/* Hero Carousel */}

      <HeroCarousel />

      {/* Full Width Sections */}
      <PromotionalDeals />
      <ProductTabs />
      <UpcomingProducts />
      <LazyLoadProducts />
      {/* <NewsletterSignup /> */}

      <Footer />
    </div>
  );
}
