import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// Simulates the audio processing pipeline
// In production, this would dispatch to Celery via Redis
async function simulateProcessing(projectId: string) {
  const stages = [
    { status: "analyzing", delay: 1500 },
    { status: "processing", delay: 3000 },
    { status: "completed", delay: 2000 },
  ];

  for (const stage of stages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));

    const updateData: Record<string, unknown> = {
      status: stage.status,
      updatedAt: new Date(),
    };

    if (stage.status === "analyzing") {
      updateData.analysisData = {
        bitrate: 320,
        loudness: -14.2,
        peakLevel: -1.2,
        clipping: false,
        spectralBalance: {
          low: 0.35,
          mid: 0.42,
          high: 0.23,
        },
        dynamicRange: 8.5,
        stereoWidth: 0.72,
        sampleRate: 44100,
        channels: 2,
      };
      updateData.durationSeconds = 245.5;
      updateData.originalBitrate = 320;
      updateData.sampleRate = 44100;
      updateData.channels = 2;
    }

    if (stage.status === "completed") {
      updateData.completedAt = new Date();
      updateData.processedFileUrl = `/api/projects/${projectId}/download`;
    }

    await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId));
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req.headers);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, id), eq(projects.userId, authUser.userId))
      )
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.status === "processing" || project.status === "analyzing") {
      return NextResponse.json(
        { error: "Project is already being processed" },
        { status: 400 }
      );
    }

    // Update status to analyzing
    await db
      .update(projects)
      .set({ status: "uploading", updatedAt: new Date() })
      .where(eq(projects.id, id));

    // Start async simulation (non-blocking)
    simulateProcessing(id).catch(async (err) => {
      console.error("Processing simulation error:", err);
      await db
        .update(projects)
        .set({
          status: "failed",
          errorMessage: "Processing failed unexpectedly",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id));
    });

    return NextResponse.json({
      message: "Processing started",
      status: "uploading",
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
