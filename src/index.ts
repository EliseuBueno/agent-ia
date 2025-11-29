import { BaseAgent } from "./agents/BaseAgent";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const agent = new BaseAgent();
  const reply = await agent.ask("Agora diga 'estou pronto para evoluir'");
  console.log(reply);
}

run();
