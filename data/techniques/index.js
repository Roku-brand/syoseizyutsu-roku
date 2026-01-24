import { achievementCards } from "./achievement.js";
import { lifeCards } from "./life.js";
import { peopleCardsPart1 } from "./people-1.js";
import { peopleCardsPart2 } from "./people-2.js";
import { skillCards } from "./skill.js";
import { thinkingCards } from "./thinking.js";

export const techniqueCards = {
  achievement: achievementCards,
  life: lifeCards,
  people: [...peopleCardsPart1, ...peopleCardsPart2],
  skill: skillCards,
  thinking: thinkingCards,
};
