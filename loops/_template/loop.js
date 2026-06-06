export default {
  name: "template-loop",
  description: "A starter loop that demonstrates observe, decide, act, and judge.",
  maxAttempts: 3,
  timeoutMs: 60_000,

  async init() {
    return {
      goal: "Replace this with the loop goal.",
      notes: [],
      history: [],
    };
  },

  async observe({ state, turn }) {
    return {
      turn,
      goal: state.goal,
      noteCount: state.notes.length,
    };
  },

  async decide({ observation }) {
    if (observation.noteCount >= 1) {
      return {
        type: "stop",
        reason: "Template loop has demonstrated one cycle.",
      };
    }

    return {
      type: "write-note",
      reason: "No notes exist yet.",
    };
  },

  async act({ state, action }) {
    const note = `Action '${action.type}' ran at ${new Date().toISOString()}`;
    state.notes.push(note);
    return { note };
  },

  async judge({ result }) {
    return {
      done: Boolean(result.note),
      reason: "Template loop completed one safe action.",
    };
  },
};
