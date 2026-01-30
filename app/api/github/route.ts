import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

type ApiContribution = {
  date: string;
  count: number;
  level: number;
};

type ApiResponse = {
  total: Record<string, number>;
  contributions: ApiContribution[];
};

export async function GET() {
  try {
    const username = "n8thantran";

    // Use public GitHub contributions API (no auth required)
    const currentYear = new Date().getFullYear();
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=${currentYear}`,
      {
        headers: {
          "User-Agent": "Portfolio/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    const contributions: ContributionDay[] = data.contributions.map((day) => ({
      date: day.date,
      count: day.count,
      level: day.level,
    }));

    // Get total for current year
    const totalContributions = data.total[String(currentYear)] || 0;

    return NextResponse.json({
      contributions,
      totalContributions,
    });
  } catch (error) {
    console.error("Failed to fetch GitHub contributions:", error);
    return NextResponse.json(
      { contributions: [], totalContributions: 0 },
      { status: 200 }
    );
  }
}
