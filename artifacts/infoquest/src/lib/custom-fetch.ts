// Fetch personalizado que inyecta el token JWT en todas las peticiones a la API
// El token se almacena en localStorage con la clave infoquest_token
export const customFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Recupera el token del almacenamiento local
  const token = localStorage.getItem("infoquest_token");

  // Construye los headers con el token de autorizacion si existe
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
