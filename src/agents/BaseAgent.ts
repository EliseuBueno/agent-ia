import { ChatGroq } from "@langchain/groq";

export class BaseAgent {
  private llm: ChatGroq;

  constructor() {
    this.llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY!,
    });
  }

  async ask(prompt: string) {
    const systemPrompt = `Você é um assistente de IA altamente eficiente. Sempre responda claramente e objetivamente.`;
    const response = await this.llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    return response.content;
  }
}
