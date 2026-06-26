import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { ensureBattleCatalog, getCatalogDiagnostics } from "@/lib/battle-store"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shouldRefreshCatalog = searchParams.get("refreshCatalog") === "1"

    await ensureBattleCatalog({ forceRefresh: shouldRefreshCatalog })
    const diagnostics = await getCatalogDiagnostics()

    return NextResponse.json(diagnostics)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Error inesperado al cargar el diagnóstico del catálogo." },
      { status: 500 }
    )
  }
}
