import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Ollama } from "@langchain/ollama";
import { config } from "../configs/config";
import { sendLog } from "../uteis/logger";

// ======== CONFIGURAÇÃO DO POSTGRES ======== //
const pool = new Pool({
  host: process.env.PG_DB_HOST,
  port: Number(process.env.PG_DB_PORT),
  user: process.env.PG_DB_USER,
  password: process.env.PG_DB_PASSWORD,
  database: process.env.PG_DB_DATABASE,
});

// ======== FUNÇÃO PRINCIPAL ======== //
export async function queryWithContext(question: string) {
  // 1️⃣ Embeddings
  const embeddings = new OllamaEmbeddings({ model: "mxbai-embed-large" });
  const questionVector = await embeddings.embedQuery(question);

  // 2️⃣ Converte para formato PostgreSQL (pgvector) -> ARRAY
  // pgvector espera '[0.1, 0.2, ...]'
  const vectorString = `[${questionVector.join(",")}]`;

  const client = await pool.connect();
  try {
    // 3️⃣ Buscar os chunks mais relevantes (top 3)
    const result = await client.query(
      `
      SELECT content, url
      FROM content
      ORDER BY embedding <-> $1
      LIMIT 3;
      `,
      [vectorString]
    );

    const context = result.rows.map((r) => r.content).join("\n\n");

    // 4️⃣ Gerar resposta com chat model
    const ollama = new Ollama({ model: config.ollamaModelName }); // modelo de chat local

    const response = await ollama.generate([
      `Você é um assistente baseado em documentos. 
      Use apenas as informações abaixo para responder.

      CONTEXTO:
      ${context}
      
      PERGUNTA:
      ${question}

      Responda de forma objetiva. Caso a resposta não esteja no contexto, diga que não foi encontrada.`
    ]);

    return response.generations?.[0]?.[0]?.text ?? "❌ Não foi possível gerar uma resposta.";
  } finally {
    client.release();
  }
}

// ======== EXEMPLO DE USO ======== //
(async () => {
  const resposta = await queryWithContext("Qual é o prazo final de inscrição?");
  sendLog.info(resposta);
})();
