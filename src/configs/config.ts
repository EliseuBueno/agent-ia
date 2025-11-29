import dotenv from "dotenv";
dotenv.config();

function parseNumber(value: string | undefined, defaultValue: number): number {
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
}

// ======== CONFIGURAÇÕES DE AMBIENTE ======== //
export const config = {
  // Ollama
  ollamaModelName: process.env.OLLAMA_MODEL_NAME || "mxbai-embed-large",

  // Banco de dados
  db: {
    host: process.env.PG_DB_HOST,
    port: Number(process.env.PG_DB_PORT),
    user: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD,
    database: process.env.PG_DB_DATABASE,
    idleTimeoutMillis: 300000, // 5 minutos
    connectionTimeoutMillis: 30000, // 30 segundos
  },

  chunks: {
    size: parseNumber(process.env.CHUNK_SIZE, 500),
    overlap: parseNumber(process.env.CHUNK_OVERLAP, 100),
    chunks: parseNumber(process.env.MAX_CHUNKS, 20000),
    batchSize: parseNumber(process.env.BATCH_SIZE, 20)
  },

  // Logger (simplificado)
  logger: {
    levels: ["debug", "info", "success", "warn", "error"] as const,
  },
};


