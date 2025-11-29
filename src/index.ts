import { BaseAgent } from "./agents/BaseAgent";
import dotenv from "dotenv";
import { sendLog } from "./uteis/logger";
dotenv.config();

async function run() {
  const agent = new BaseAgent();
  const reply = await agent.ask("Agora diga 'estou pronto para evoluir'");
  sendLog.info(`${reply}`);
}

run();
