import { Blocks } from "lucide-react";

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <span className={`brand-lockup${compact ? " brand-lockup-compact" : ""}`}>
    <span className="brand-mark" aria-hidden="true">
      <Blocks />
    </span>
    <span className="brand-name">Blockboard</span>
  </span>
);

export default Brand;
