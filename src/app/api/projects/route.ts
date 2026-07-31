import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req.headers);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, authUser.userId))
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req.headers);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, originalFilename, outputFormat, processingSettings } =
      await req.json();

    if (!title || !originalFilename) {
      return NextResponse.json(
        { error: "Title and original filename are required" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: authUser.userId,
        title,
        originalFilename,
        outputFormat: outputFormat || "mp3",
        processingSettings: processingSettings || {
          normalize: true,
          denoise: false,
          eqCorrection: true,
          multibandCompression: true,
          stereoEnhancement: false,
          limiting: true,
          loudnessNormalization: true,
        },
        status: "pending",
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
