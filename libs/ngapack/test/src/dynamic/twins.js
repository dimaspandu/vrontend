export const SOURCE_OF_TRUTH = {
  phase: 0
};

export default function twins(user) {
  if (user) {
    return `I'm used by ${user}!`;
  }
  return "I'm used by A and B!";
}