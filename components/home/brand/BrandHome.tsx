import { BrandHero } from "@/components/home/brand/BrandHero";
import { BrandSections } from "@/components/home/brand/BrandSections";
import BrandHeroV2 from "./BrandHeroV2";
import GrowSect from "./GrowSect";
import BrandSolution from "./BrandSolution";

/** Dark, premium, data-forward landing experience for the Brand audience. */
export function BrandHome() {
  return (
    <>
      <BrandHeroV2 />
      <BrandSolution />
      <GrowSect />
      <BrandSections />
    </>
  );
}
