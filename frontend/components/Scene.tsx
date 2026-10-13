import { Destination } from "@/lib/destinations";

function Extras({ variant }: { variant: Destination["variant"] }) {
  switch (variant) {
    case "lisbon":
      return (
        <>
          <rect x="150" y="205" width="44" height="60" />
          <rect x="198" y="188" width="36" height="77" />
          <rect x="238" y="214" width="52" height="51" />
          <rect x="560" y="196" width="16" height="70" />
          <polygon points="556,196 568,168 580,196" />
          <rect x="900" y="200" width="40" height="65" />
          <rect x="944" y="216" width="56" height="49" />
          <rect x="1020" y="206" width="34" height="59" />
        </>
      );
    case "kyoto":
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const y = 262 - i * 36;
            return (
              <g key={i}>
                <polygon
                  points={`${636 + i * 10},${y} ${764 - i * 10},${y} ${746 - i * 10},${y - 18} ${654 + i * 10},${y - 18}`}
                />
                <rect x={670 + i * 8} y={y - 36} width={60 - i * 16} height="18" />
              </g>
            );
          })}
          <rect x="692" y="104" width="16" height="32" />
          <rect x="860" y="236" width="54" height="29" />
          <rect x="920" y="244" width="40" height="21" />
        </>
      );
    case "marrakech":
      return (
        <>
          <rect x="690" y="140" width="46" height="125" />
          <rect x="702" y="118" width="22" height="22" />
          <circle cx="713" cy="112" r="8" />
          <rect x="540" y="238" width="48" height="27" />
          <rect x="600" y="226" width="70" height="39" />
          <rect x="780" y="218" width="60" height="47" />
          <rect x="846" y="232" width="44" height="33" />
        </>
      );
    case "reykjavik":
      return (
        <>
          <polygon points="300,262 420,150 540,262" />
          <polygon points="480,262 620,120 760,262" />
          <polygon
            points="620,120 596,150 612,144 622,158 634,146 648,152"
            fill="#ffffff"
            opacity="0.85"
          />
          <rect x="878" y="220" width="70" height="45" />
          <rect x="900" y="170" width="26" height="95" />
          <polygon points="900,170 913,112 926,170" />
        </>
      );
  }
}

export default function Scene({
  destination,
  className = "",
}: {
  destination: Destination;
  className?: string;
}) {
  const { palette, variant } = destination;
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <circle cx="760" cy="130" r="64" fill={palette.sun} opacity="0.9" />
      <path
        d="M0 200 C 240 120 480 240 720 170 C 960 100 1200 230 1440 160 L1440 320 L0 320 Z"
        fill={palette.far}
      />
      <path
        d="M0 240 C 300 180 520 280 800 220 C 1060 170 1260 260 1440 210 L1440 320 L0 320 Z"
        fill={palette.mid}
      />
      <g fill={palette.detail}>
        <Extras variant={variant} />
      </g>
      <path
        d="M0 285 C 360 250 700 310 1000 275 C 1200 255 1340 290 1440 270 L1440 320 L0 320 Z"
        fill={palette.near}
      />
    </svg>
  );
}