// Curated destination photography and inspiration data for the itinerary planner

export const DESTINATION_PHOTOS = {
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  tokyo: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
  "swiss alps": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80",
  switzerland: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
  nyc: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
  italy: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
  greece: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
  hawaii: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  iceland: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80",
};

export const DEFAULT_DESTINATION_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";

export const HERO_BANNER_IMAGE = "/hero-banner.jpg";

export function getDestinationImage(name = "") {
  if (!name || typeof name !== "string") return DEFAULT_DESTINATION_IMAGE;
  const clean = name.toLowerCase().trim();

  // Exact match
  if (DESTINATION_PHOTOS[clean]) {
    return DESTINATION_PHOTOS[clean];
  }

  // Substring match
  for (const [key, url] of Object.entries(DESTINATION_PHOTOS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return url;
    }
  }

  // Keyword thematic matching
  if (clean.includes("beach") || clean.includes("island") || clean.includes("coast")) {
    return DESTINATION_PHOTOS.goa;
  }
  if (clean.includes("mountain") || clean.includes("snow") || clean.includes("hike") || clean.includes("ski")) {
    return DESTINATION_PHOTOS["swiss alps"];
  }
  if (clean.includes("temple") || clean.includes("asia")) {
    return DESTINATION_PHOTOS.kyoto;
  }

  return DEFAULT_DESTINATION_IMAGE;
}

export const POPULAR_DESTINATIONS = [
  {
    destination: "Goa",
    country: "India",
    tagline: "Sun-drenched beaches & coastal cuisine",
    days: 3,
    budget: "moderate",
    traveler_type: "solo",
    interests: ["beaches", "seafood", "nightlife"],
    image: DESTINATION_PHOTOS.goa,
  },
  {
    destination: "Tokyo",
    country: "Japan",
    tagline: "Futuristic neon, historic shrines & ramen",
    days: 5,
    budget: "moderate",
    traveler_type: "couple",
    interests: ["culture", "food", "technology"],
    image: DESTINATION_PHOTOS.tokyo,
  },
  {
    destination: "Paris",
    country: "France",
    tagline: "Romantic boulevards, art & haute cuisine",
    days: 4,
    budget: "luxury",
    traveler_type: "couple",
    interests: ["art", "history", "cafes"],
    image: DESTINATION_PHOTOS.paris,
  },
  {
    destination: "Bali",
    country: "Indonesia",
    tagline: "Lush rice terraces, temples & surf",
    days: 5,
    budget: "budget",
    traveler_type: "friends",
    interests: ["nature", "beaches", "wellness"],
    image: DESTINATION_PHOTOS.bali,
  },
  {
    destination: "Swiss Alps",
    country: "Switzerland",
    tagline: "Glacier peaks, scenic trains & fondue",
    days: 4,
    budget: "luxury",
    traveler_type: "couple",
    interests: ["mountains", "hiking", "scenery"],
    image: DESTINATION_PHOTOS["swiss alps"],
  },
  {
    destination: "New York",
    country: "USA",
    tagline: "Broadway, iconic skyline & street food",
    days: 3,
    budget: "moderate",
    traveler_type: "solo",
    interests: ["museums", "architecture", "food"],
    image: DESTINATION_PHOTOS["new york"],
  },
];
