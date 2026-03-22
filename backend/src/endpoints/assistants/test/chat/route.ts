import { Request, Response } from "express";
import { processChat } from "../../../../modules/assistant/chat.service";

export const POST = async (req: Request, res: Response) => {
  try {
    const { assistantId, conversationId, input } = req.body;
    
    if (!assistantId || !conversationId || !input) {
      return res.status(400).json({ error: "Missing required fields: assistantId, conversationId, input" });
    }

    const result = await processChat({ assistantId, conversationId, input });
    
    // Pipe the standard AI SDK streams to the Express response
    result.pipeTextStreamToResponse(res);

  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
