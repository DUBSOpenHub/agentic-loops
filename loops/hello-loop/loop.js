export default {
  name: "hello-loop",
  description: "A minimal loop that drafts, critiques, improves, and stops.",
  maxAttempts: 4,
  timeoutMs: 60_000,

  async init() {
    return {
      goal: "Create a friendly explanation of an agentic loop.",
      draft: "",
      history: [],
    };
  },

  async observe({ state, turn }) {
    return {
      turn,
      hasDraft: state.draft.length > 0,
      draft: state.draft,
    };
  },

  async decide({ observation }) {
    if (!observation.hasDraft) {
      return {
        type: "draft",
        reason: "No draft exists yet.",
      };
    }

    return {
      type: "improve",
      reason: "A draft exists; improve it so it teaches the loop shape.",
    };
  },

  async act({ state, action }) {
    if (action.type === "draft") {
      state.draft = "An agentic loop helps an AI keep working toward a goal.";
    } else {
      state.draft = "An agentic loop is: observe -> decide -> act -> judge -> repeat until the goal is done.";
    }

    return {
      message: state.draft,
    };
  },

  async judge({ result }) {
    const done = result.message.includes("observe -> decide -> act -> judge");
    return {
      done,
      reason: done ? "The message explains the loop shape." : "The message needs one more pass.",
    };
  },
};
