import dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import pdfParse from "pdf-parse";
import { OllamaEmbeddings } from "@langchain/ollama";
import { config } from "./configs/config";
import { sendLog } from "./uteis/logger";
import { pool } from "./configs/conections/dbPgsql";

// ======== CONFIGURAÇÕES ======== //
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const MAX_CHUNKS = 2000;
const BATCH_SIZE = 20;

// ======== FUNÇÕES AUXILIARES ======== //
async function extractTextFromPDF(filePath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    return pdfData.text;
}

function chunkText(text: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
        if (chunks.length >= MAX_CHUNKS) break;
    }
    return chunks;
}

// ======== FUNÇÃO PRINCIPAL ======== //
async function vectorizeAndStoreDocument(filePath: string, url: string) {
    sendLog.info("Extraindo texto do PDF...");
    const text = await extractTextFromPDF(filePath);

    sendLog.info("Dividindo em chunks...");
    const chunks = chunkText(text);

    const embeddings = new OllamaEmbeddings({ model: config.ollamaModelName });

    sendLog.info(`Gerando embeddings para ${chunks.length} chunks...`);

    // Gerar todos embeddings antes de abrir a conexão
    const allVectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const vectors = await Promise.all(batch.map(chunk => embeddings.embedQuery(chunk)));
        allVectors.push(...vectors.map(vec => vec.map(Number)));
        sendLog.info(`Embeddings gerados para chunks ${i + 1} a ${i + batch.length}`);
    }

    sendLog.info("Conectando ao banco para inserir embeddings...");
    const client = await pool.connect();
    try {
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            const batchVectors = allVectors.slice(i, i + BATCH_SIZE);

            const values: any[] = [];
            const placeholders: string[] = [];

            batchVectors.forEach((vector, idx) => {
                const paramIdx = values.length + 1;
                const vectorLiteral = `[${vector.join(",")}]`;
                values.push(batchChunks[idx], url, vectorLiteral);
                placeholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2})`);
            });

            const query = `INSERT INTO content (content, url, embedding) VALUES ${placeholders.join(",")}`;
            await client.query(query, values);

            sendLog.info(`Inseridos chunks ${i + 1} a ${i + batchChunks.length}`);
        }

        sendLog.success("Finalizado! Documento vetorizado e salvo no PostgreSQL.");
    } finally {
        client.release();
    }
}

// ======== EXECUÇÃO ======== //
(async () => {
    try {
        await vectorizeAndStoreDocument("./storage/docs/Edital.pdf", "https://meusite.com/edital");
    } catch (error: any) {
        sendLog.error("Erro ao processar documento:", {error: error.message, stack: error.stack});
    } finally {
        await pool.end();
        sendLog.success("Conexão com banco encerrada.");
    }
})();
