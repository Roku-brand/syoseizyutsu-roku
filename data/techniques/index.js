import { techniqueCards as allTechniqueCards } from "./all-techniques.js";

// Re-export the unified technique cards
export const techniqueCards = allTechniqueCards;

// Legacy accessor for backward compatibility
// Maps category keys to their data for existing code
const categoryKeyMap = {
  relationships: "relationships",
  work: "work",
  mental: "mental",
  life: "life",
  challenge: "challenge",
};

export { allTechniqueCards, categoryKeyMap };
