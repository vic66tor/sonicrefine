import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
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

    if (project.status !== "completed") {
      return NextResponse.json(
        { error: "Project processing not completed" },
        { status: 400 }
      );
    }

    const format = req.nextUrl.searchParams.get("format") || project.outputFormat || "mp3";

    // In production, this would return a pre-signed S3 URL or stream the file
    // For MVP, we return a placeholder response
    return NextResponse.json({
      message: `Download ready in ${format.toUpperCase()} format`,
      format,
      filename: `${project.title}_enhanced.${format}`,
      note: "In production, this endpoint would stream the processed file from S3 storage",
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
