"use client";

import Snowfall from "react-snowfall";

export default function SnowLayer() {
  return (
    <Snowfall
      snowflakeCount={50}
      speed={[0.2, 0.6]}
      wind={[-0.2, 0.2]}
      radius={[0.5, 2.4]}
      color="#00F6FF"
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 4,
      }}
    />
  );
}
