/**
 * Canonical Episode Schema Validator for The Lincoln Penny
 * 
 * Enforces:
 * - Structural integrity (title, episodeId, characters, render settings)
 * - Research & factual boundaries (verifiedFacts, doNotClaim)
 * - Performance directives & vocal scoring (performanceDirection, semantic pauses)
 * - Safety & distribution boundaries (approved, defaultPrivacy)
 */

const VALID_PAUSE_TYPES = [
  'thought_processing',
  'deadpan_disbelief',
  'comedic_beat',
  'breath_anticipation',
  'hesitation_pivot',
  'natural_turn'
];

const VALID_PERFORMANCE_DIRECTIONS = [
  'deadpan_disbelief',
  'genuine_curiosity',
  'personal_offense',
  'delayed_realization',
  'dry_understatement',
  'matter_of_fact',
  'smug_revelation',
  'inquisitive_skeptic'
];

function validateEpisode(episode) {
  const errors = [];

  if (!episode || typeof episode !== 'object') {
    return { valid: false, errors: ['Episode must be an object'] };
  }
  if (!episode.episodeId || typeof episode.episodeId !== 'string') {
    errors.push("Missing or invalid 'episodeId'");
  }
  if (!episode.title || typeof episode.title !== 'string') {
    errors.push("Missing or invalid 'title'");
  }
  if (!Array.isArray(episode.characters) || episode.characters.length < 2) {
    errors.push("Episode must specify at least 2 characters (host, insider)");
  }
  if (!episode.research || !Array.isArray(episode.research.verifiedFacts) || episode.research.verifiedFacts.length === 0) {
    errors.push("Episode must contain verified research facts");
  }
  if (!episode.dialogue || !Array.isArray(episode.dialogue) || episode.dialogue.length === 0) {
    errors.push("Episode must contain dialogue turns");
  } else {
    // Validate individual dialogue turns
    episode.dialogue.forEach((line, idx) => {
      if (!line.speaker || !['host', 'insider', 'guest'].includes(line.speaker)) {
        errors.push(`Dialogue line #${idx}: invalid speaker '${line.speaker}'`);
      }
      if (!line.text || typeof line.text !== 'string' || line.text.trim().length === 0) {
        errors.push(`Dialogue line #${idx}: missing text`);
      }
      if (line.pauseAfter && typeof line.pauseAfter === 'object') {
        if (line.pauseAfter.type && !VALID_PAUSE_TYPES.includes(line.pauseAfter.type)) {
          errors.push(`Dialogue line #${idx}: unknown pauseAfter type '${line.pauseAfter.type}'`);
        }
      }
      if (line.pauseBefore && typeof line.pauseBefore === 'object') {
        if (line.pauseBefore.type && !VALID_PAUSE_TYPES.includes(line.pauseBefore.type)) {
          errors.push(`Dialogue line #${idx}: unknown pauseBefore type '${line.pauseBefore.type}'`);
        }
      }
      if (line.performanceDirection && !VALID_PERFORMANCE_DIRECTIONS.includes(line.performanceDirection)) {
        errors.push(`Dialogue line #${idx}: unknown performanceDirection '${line.performanceDirection}'`);
      }
    });
  }

  if (!episode.render || episode.render.width !== 1080 || episode.render.height !== 1920) {
    errors.push("Render dimensions must be 1080x1920 (Vertical 9:16)");
  }
  if (episode.distribution && episode.distribution.approved !== true && episode.distribution.defaultPrivacy === 'public') {
    errors.push("Safety violation: Unapproved episode cannot have defaultPrivacy set to 'public'");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEpisode,
  VALID_PAUSE_TYPES,
  VALID_PERFORMANCE_DIRECTIONS
};
