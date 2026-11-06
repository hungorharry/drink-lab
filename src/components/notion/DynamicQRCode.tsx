"use client";

import React, { useMemo } from "react";
import { generateQrMatrix, qrToSvgPath } from "@/utils/qrCode";

interface DynamicQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showCenterIcon?: boolean;
}

export const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({
  value,
  size = 200,
  className = "",
  showCenterIcon = true,
}) => {
  // Generate exact QR code modules matrix based on the link
  const qr = useMemo(() => {
    try {
      return generateQrMatrix(value || "https://sipcraft.app");
    } catch (e) {
      console.error("QR Code Generation Error:", e);
      return generateQrMatrix("https://sipcraft.app");
    }
  }, [value]);

  const svgPath = useMemo(() => qrToSvgPath(qr), [qr]);

  // Standard QR Quiet Zone (margin) of 2 modules
  const margin = 2;
  const totalSize = qr.size + margin * 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-sm border border-surface-container-high/60 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        className="w-full h-full text-black shape-rendering-crisp"
        fill="currentColor"
      >
        {/* White Background for optimal optical camera contrast */}
        <rect
          x="0"
          y="0"
          width={totalSize}
          height={totalSize}
          fill="#FFFFFF"
        />

        {/* QR Code Modules Path */}
        <g transform={`translate(${margin}, ${margin})`}>
          <path d={svgPath} fill="#000000" />
        </g>
      </svg>

      {/* Center Beer Icon Emblem */}
      {showCenterIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md ring-4 ring-white">
            <span className="material-symbols-outlined text-on-primary text-[20px]">
              sports_bar
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
