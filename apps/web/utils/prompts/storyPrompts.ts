/**
 * Story Prompt Templates
 * Reusable prompt templates for story generation
 */

export interface StoryPromptParams {
  childName: string;
  childAge: number;
  theme: string;
  pageCount: number;
  wordsPerPage: string;
  category?: string;
  dedication?: string;
  characterDescription?: string;
}

/**
 * Age-appropriate language guidance
 */
export const AGE_GUIDANCE: Record<string, {
  language: string;
  themes: string;
  complexity: string;
}> = {
  "3-5": {
    language: "Very simple words, short sentences, lots of repetition, basic concepts like colors and numbers",
    themes: "Friendship, sharing, bedtime, animals, colors, counting, family love",
    complexity: "One main event per page, simple cause and effect",
  },
  "6-8": {
    language: "Simple but engaging vocabulary, complete sentences, gentle tension and resolution",
    themes: "Adventure, problem-solving, friendship, family, nature, being brave",
    complexity: "Simple plot with beginning, middle, end. One or two challenges to overcome",
  },
  "9-12": {
    language: "Rich vocabulary, complex sentence structures, character development, dialogue",
    themes: "Bravery, teamwork, moral lessons, discovery, mystery, growing up",
    complexity: "Multi-layered plot, character growth, meaningful challenges",
  },
};

/**
 * Get age range key from numeric age
 */
export function getAgeRange(age: number): string {
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  return "9-12";
}

/**
 * Build the main story generation prompt
 */
export function buildMainStoryPrompt(params: StoryPromptParams): string {
  const ageRange = getAgeRange(params.childAge);
  const guidance = AGE_GUIDANCE[ageRange];

  return `You are a professional children's book author creating a personalized story.

TARGET AUDIENCE: ${params.childAge}-year-old child named ${params.childName}
STORY LENGTH: ${params.pageCount} pages (${params.wordsPerPage} words per page)
THEME: ${params.theme}
${params.category ? `CATEGORY: ${params.category}` : ""}

LANGUAGE STYLE: ${guidance.language}
APPROPRIATE THEMES: ${guidance.themes}
STORY COMPLEXITY: ${guidance.complexity}

${params.characterDescription ? `CHARACTER APPEARANCE: ${params.characterDescription}` : ""}
${params.dedication ? `DEDICATION TO INCLUDE: "${params.dedication}"` : ""}

CRITICAL REQUIREMENTS:
1. ${params.childName} MUST be the hero of every page
2. Use age-appropriate vocabulary for a ${params.childAge}-year-old
3. Include comic-style dialogue and action
4. Each page needs a clear, illustratable scene
5. End with a positive, satisfying conclusion
6. Include gentle moral lessons naturally woven into the story

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "title": "Creative title featuring ${params.childName}",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The story text that will be read aloud (${params.wordsPerPage} words)",
      "sceneDescription": "Detailed visual description for the illustrator: setting, character position, action, lighting, mood",
      "emotion": "The primary emotion ${params.childName} is feeling (happy, excited, curious, brave, surprised, etc.)"
    }
  ]
}`;
}

/**
 * Build image generation prompt for consistent character
 */
export function buildImageGenerationPrompt(params: {
  characterName: string;
  sceneDescription: string;
  emotion: string;
  artStyle: string;
  characterReference?: string;
}): string {
  return `${params.artStyle}

SCENE: ${params.sceneDescription}

CHARACTER: A child named ${params.characterName} who looks exactly like the reference image.
CHARACTER EMOTION: ${params.emotion}
${params.characterReference ? `REFERENCE: Use face from ${params.characterReference}` : ""}

STYLE REQUIREMENTS:
- Vibrant, child-friendly colors
- Disney/Pixar quality illustration
- Soft, warm lighting
- No text or watermarks
- High detail, 4K quality
- Comic book panel composition
- Expressive character faces
- Age-appropriate content only`;
}

/**
 * Pre-built story starters for quick generation
 */
export const STORY_STARTERS = [
  {
    id: "space-adventure",
    title: "Space Explorer",
    theme: "Blasts off to explore the stars and makes friends with a friendly alien",
    category: "space",
    icon: "🚀",
  },
  {
    id: "dragon-friend",
    title: "Dragon Friend",
    theme: "Discovers a baby dragon and must help it find its way home",
    category: "fantasy",
    icon: "🐉",
  },
  {
    id: "ocean-mystery",
    title: "Ocean Mystery",
    theme: "Dives underwater and discovers a magical kingdom of sea creatures",
    category: "ocean",
    icon: "🐠",
  },
  {
    id: "superhero-day",
    title: "Superhero Day",
    theme: "Wakes up with superpowers and uses them to help everyone in town",
    category: "superhero",
    icon: "🦸",
  },
  {
    id: "magic-garden",
    title: "Magic Garden",
    theme: "Finds a magical garden where flowers talk and grant wishes",
    category: "fantasy",
    icon: "🌸",
  },
  {
    id: "dinosaur-time",
    title: "Dinosaur Time",
    theme: "Travels back in time and befriends a gentle dinosaur",
    category: "dinosaurs",
    icon: "🦕",
  },
  {
    id: "sleepy-stars",
    title: "Sleepy Stars",
    theme: "Floats up to the stars at bedtime and meets the moon",
    category: "bedtime",
    icon: "🌙",
  },
  {
    id: "forest-adventure",
    title: "Forest Friends",
    theme: "Gets lost in an enchanted forest and is guided home by woodland animals",
    category: "animals",
    icon: "🦊",
  },
];

export default {
  AGE_GUIDANCE,
  getAgeRange,
  buildMainStoryPrompt,
  buildImageGenerationPrompt,
  STORY_STARTERS,
};

