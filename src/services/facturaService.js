import { supabase } from "../supabaseClient";

const BUCKET = "factura-archivos";

export async function fetchFacturas() {
  const { data, error } = await supabase
    .from("facturas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(
      "No se pudo cargar el historial de facturas. Intenta recargar la página.",
    );
  return data;
}

export async function searchFacturas(query) {
  const { data, error } = await supabase
    .from("facturas")
    .select("*")
    .ilike("proveedor", `%${query}%`)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error("No se pudo realizar la búsqueda. Intenta de nuevo.");
  return data;
}

export async function deleteFactura(id, archivoUrl) {
  const { error } = await supabase.from("facturas").delete().eq("id", id);

  if (error) {
    if (error.code === "42501")
      throw new Error(
        "Sin permisos para eliminar facturas. Verifica las políticas de seguridad en Supabase.",
      );
    throw new Error("No se pudo eliminar la factura. Intenta de nuevo.");
  }

  if (archivoUrl) {
    const nombreArchivo = archivoUrl.split("/").pop();
    await supabase.storage.from(BUCKET).remove([nombreArchivo]);
  }
}

export async function insertFactura(factura) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");

  const { error } = await supabase
    .from("facturas")
    .insert([{ ...factura, user_id: userId }]);

  if (error) {
    if (error.code === "42501")
      throw new Error(
        "Sin permisos para guardar facturas. Verifica las políticas de seguridad en Supabase.",
      );
    if (error.code === "23505")
      throw new Error("Esta factura ya fue registrada anteriormente.");
    throw new Error("No se pudo guardar la factura. Intenta de nuevo.");
  }
}

export async function uploadArchivo(file) {
  const extension = file.name.split(".").pop();
  const nombreArchivo = `factura_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, file, { contentType: file.type });

  if (error) {
    if (error.message?.includes("security"))
      throw new Error(
        "Sin permisos para subir archivos. Verifica las políticas del bucket en Supabase.",
      );
    throw new Error("No se pudo subir el archivo. Intenta de nuevo.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo);
  return data.publicUrl;
}
