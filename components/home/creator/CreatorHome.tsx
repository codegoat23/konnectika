import { CreatorHero } from "@/components/home/creator/CreatorHero";
import { CreatorSections } from "@/components/home/creator/CreatorSections";
import CreatorHeroV2 from "./CreatorHeroV2";

/** Light, community-first landing experience for the Creator audience. */
export function CreatorHome() {
  return (
    <>
      <CreatorHeroV2 />
      <CreatorSections />
    </>
  );
}
