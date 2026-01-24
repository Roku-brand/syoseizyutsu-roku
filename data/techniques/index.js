import { achievementCards } from "./achievement.js";
import { lifeTechniques as lifeCards } from "./life.js";
import { peopleTechniquesPart1 as peopleCardsPart1 } from "./people-1.js";
import { peopleTechniquesPart2 as peopleCardsPart2 } from "./people-2.js";
import { skillTechniques as skillCards } from "./skill.js";
import { thinkingTechniques as thinkingCards } from "./thinking.js";

export const techniqueCards = {
  achievement: achievementCards,
  life: lifeCards,
  people: {
    title: "対人術",
    items: [...peopleCardsPart1.items, ...peopleCardsPart2.items],
  },
  skill: skillCards,
  thinking: thinkingCards,
};
