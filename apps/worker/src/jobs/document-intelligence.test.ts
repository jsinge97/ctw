import { describe, expect, it, vi } from "vitest";
import { analyzeDocument, classifyDocumentFromText } from "./document-intelligence.js";

describe("document intelligence", () => {
  it("classifies common CRE document types deterministically in fake mode", async () => {
    await expect(
      analyzeDocument({
        bytes: new TextEncoder().encode("This lease agreement covers suite 1400."),
        filename: "lease.txt",
        mimeType: "text/plain"
      }, { CTW_AI_MODE: "fake" } as NodeJS.ProcessEnv)
    ).resolves.toMatchObject({ documentType: "lease", classificationStatus: "classified", ocrStatus: "complete" });
  });

  it("parses structured output from OpenAI Responses API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    documentType: "loi",
                    confidence: 0.94,
                    extractedText: "Letter of intent for Sutter Tower.",
                    summary: "LOI for Sutter Tower."
                  })
                }
              ]
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    await expect(
      analyzeDocument(
        { bytes: new TextEncoder().encode("pdf bytes"), filename: "LOI.pdf", mimeType: "application/pdf" },
        { CTW_AI_MODE: "live", OPENAI_API_KEY: "sk_live_123", OPENAI_MODEL: "gpt-5.5" } as NodeJS.ProcessEnv,
        fetchMock as typeof fetch
      )
    ).resolves.toMatchObject({ documentType: "loi", confidence: 0.94, ocrStatus: "complete" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer sk_live_123" })
      })
    );
  });

  it("falls back to unknown when metadata is not enough", () => {
    expect(classifyDocumentFromText("document.pdf")).toEqual({ documentType: "unknown", confidence: 0.3 });
  });
});
