export async function synthesizeNeuralResponse(
  botSlug: string,
  prompt: string,
  intermediateContext?: string
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && (!openRouterKey || openRouterKey.startsWith("your-"))) {
    return null;
  }

  const systemInstructions: Record<string, string> = {
    codebot:
      "You are CodeBot on NanoBot. Provide concise, expert code architecture, algorithmic solutions, and security analysis. Output formatted markdown with typescript/python blocks. Do not mention any AI company or model names.",
    visionbot:
      "You are VisionBot on NanoBot. Explain the visual features, layout topology, and structural elements of the analyzed image. Do not mention any AI company or model names.",
    databot:
      "You are DataBot on NanoBot. Provide rigorous statistical data distribution insights, anomaly isolation findings, and tabular recommendations. Do not mention any AI company or model names.",
    researchbot:
      "You are ResearchBot on NanoBot. Provide deep academic literature synthesis, structured thematic findings, and formal citations. Do not mention any AI company or model names.",
    documentbot:
      "You are DocumentBot on NanoBot. Provide structured document parsing, key takeaways, and hierarchical data extractions. Do not mention any AI company or model names.",
    studybot:
      "You are StudyBot on NanoBot. Provide structured pedagogical breakdowns, core principles, step-by-step conceptual deconstructions, and self-check questions. Do not mention any AI company or model names.",
    chatbot:
      "You are ChatBot on NanoBot. Provide clear, precise, engineered multi-turn guidance. Do not mention any AI company or model names.",
  };

  const sysPrompt = systemInstructions[botSlug.toLowerCase()] || systemInstructions.chatbot;
  const userContent = intermediateContext
    ? `Input Task: ${prompt}\n\nLayer Preprocessing Context:\n${intermediateContext}\n\nProvide the final synthesized result.`
    : prompt;

  // 1. Try Groq (Ultra low latency)
  if (groqKey && !groqKey.startsWith("your-")) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string") {
          return content.trim();
        }
      }
    } catch (err) {
      console.warn("Groq neural synthesis fallback:", err);
    }
  }

  // 2. Try OpenRouter
  if (openRouterKey && !openRouterKey.startsWith("your-")) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NanoBot Platform",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string") {
          return content.trim();
        }
      }
    } catch (err) {
      console.warn("OpenRouter neural synthesis fallback:", err);
    }
  }

  return null;
}
