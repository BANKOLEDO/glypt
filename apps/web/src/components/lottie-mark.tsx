import { Lottie } from "lottie-react";
import animationData from "../assets/glypt-mark.json";

export function LottieMark({ className }: { className?: string }) {
  return <Lottie src={animationData} loop autoplay className={className} aria-hidden />;
}

export default LottieMark;
