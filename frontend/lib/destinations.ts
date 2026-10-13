export type Variant = "lisbon" | "kyoto" | "marrakech" | "reykjavik";

export type Destination = {
  city: string;
  country: string;
  line: string;
  variant: Variant;
  sky: string;
  palette: {
    sun: string;
    far: string;
    mid: string;
    detail: string;
    near: string;
  };
};

export const DESTINATIONS: Destination[] = [
  {
    city: "Lisbon",
    country: "Portugal",
    line: "Tram lines, tiled hills and sunsets over the river.",
    variant: "lisbon",
    sky: "linear-gradient(180deg, #ffb36b 0%, #f0624d 100%)",
    palette: { sun: "#ffd27a", far: "#f2905f", mid: "#d9573f", detail: "#b3402f", near: "#7a2a22" },
  },
  {
    city: "Kyoto",
    country: "Japan",
    line: "Temples at dawn and tea houses after dark.",
    variant: "kyoto",
    sky: "linear-gradient(180deg, #5bb89b 0%, #1f6f63 100%)",
    palette: { sun: "#f6e7a6", far: "#5fb39a", mid: "#2e8b73", detail: "#1b5e55", near: "#0a3f44" },
  },
  {
    city: "Marrakech",
    country: "Morocco",
    line: "Spice markets, courtyards and mountain day trips.",
    variant: "marrakech",
    sky: "linear-gradient(180deg, #f7b24a 0%, #db6a32 100%)",
    palette: { sun: "#ffe08a", far: "#ee9a4b", mid: "#d1662d", detail: "#a3481e", near: "#6d2f12" },
  },
  {
    city: "Reykjavik",
    country: "Iceland",
    line: "Hot springs, waterfalls and long summer light.",
    variant: "reykjavik",
    sky: "linear-gradient(180deg, #9ad0f0 0%, #3f7cb3 100%)",
    palette: { sun: "#f3f8ff", far: "#6fb4dc", mid: "#3f7cb3", detail: "#2a5a8f", near: "#1b3a6b" },
  },
];