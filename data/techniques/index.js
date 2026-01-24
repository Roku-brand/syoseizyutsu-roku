import { achievementCards } from "./achievement.js";
import { lifeTechniques as lifeCards } from "./life.js";
import { peopleTechniquesPart1 as peopleCardsPart1 } from "./people-1.js";
import { peopleTechniquesPart2 as peopleCardsPart2 } from "./people-2.js";
import { skillTechniques as skillCards } from "./skill.js";
import { thinkingTechniques as thinkingCards } from "./thinking.js";

export const techniqueCards = {
  achievement: achievementCards,
  life: lifeCards,
  people: [...peopleCardsPart1, ...peopleCardsPart2],
  skill: skillCards,
  thinking: thinkingCards,
};
