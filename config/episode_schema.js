/**
 * Canonical Episode Schema Validator for The Lincoln Penny
 */

function validateEpisode(episode) {
  const errors = [];

  if (!episode || typeof episode !== "object") {
    return { valid: false, errors: ["Episode must be an object"] };
  }
  if (!episode.episodeId || typeof episode.episodeId !== "string") {
    errors.push("Missing or invalid 'episodeId'");
  }
  if (!episode.title || typeof episode.title !== "string") {
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
  }
  if (!episode.render || episode.render.width !== 1080 || episode.render.height !== 1920) {
    errors.push("Render dimensions must be 1080x1920");
  }
  if (episode.distribution && episode.distribution.approved !== true && episode.distribution.defaultPrivacy === "public") {
    errors.push("Safety violation: Unapproved episode cannot have defaultPrivacy set to 'public'");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateEpisode,
};
