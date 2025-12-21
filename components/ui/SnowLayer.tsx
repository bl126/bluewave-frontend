"use client";

import Snowfall from "react-snowfall";

export default function SnowLayer() {
  return (
    <Snowfall
      snowflakeCount={50}
      speed={[0.15, 0.4]}
      wind={[-0.1, 0.1]}
      radius={[0.4, 1.4]}
      color="#00F6FF"
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}
