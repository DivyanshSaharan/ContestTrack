import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // First check if the error response is in JSON format
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        // Clone the response to avoid "body already read" errors
        const clonedRes = res.clone();
        const errorData = await clonedRes.json();
        
        // If there's a message field, use it for the error
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Otherwise, stringify the whole error object
        throw new Error(JSON.stringify(errorData));
      } catch (jsonError) {
        // If JSON parsing fails, fallback to text
        const text = await res.text() || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } else {
      // If not JSON, use text as before
      const text = await res.text() || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any,
  customHeaders?: HeadersInit
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  // Only add body for non-GET requests and if body is provided
  if (method !== 'GET' && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  // Return the response without parsing it
  // The caller can then use .json() or other methods as needed
  const response = await fetch(url, options);
  
  // Check if response is ok, will throw if not
  await throwIfResNotOk(response);
  
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Check if the response has content
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await res.json();
    }
    
    // If no content or not JSON, return null
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
