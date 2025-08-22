import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { proad_id, demanda_id, descricao } = await request.json();
    if (!descricao || (!proad_id && !demanda_id)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await openDb();
    await db.run(
      "INSERT INTO andamentos (proad_id, demanda_id, descricao) VALUES (?, ?, ?)",
      [proad_id, demanda_id, descricao]
    );

    // Opcional: Mudar o status do processo pai para 'Em andamento'
    if (proad_id) {
        await db.run("UPDATE proads SET status = 'Em andamento' WHERE id = ?", [proad_id]);
    }
    if (demanda_id) {
        await db.run("UPDATE demandas SET status = 'Em andamento' WHERE id = ?", [demanda_id]);
    }


    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create andamento:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create andamento" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const proad_id = searchParams.get('proad_id');
      const demanda_id = searchParams.get('demanda_id');
  
      if (!proad_id && !demanda_id) {
        return NextResponse.json(
          { success: false, error: "Missing proad_id or demanda_id" },
          { status: 400 }
        );
      }

      const db = await openDb();
      let query = "SELECT * FROM andamentos WHERE";
      const params = [];

      if (proad_id) {
        query += " proad_id = ?";
        params.push(proad_id);
      } else {
        query += " demanda_id = ?";
        params.push(demanda_id!);
      }
      query += " ORDER BY created_at DESC";

      const andamentos = await db.all(query, params);
      return NextResponse.json({ success: true, data: andamentos });

    } catch (error) {
      console.error("Failed to fetch andamentos:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch andamentos" },
        { status: 500 }
      );
    }
  }
