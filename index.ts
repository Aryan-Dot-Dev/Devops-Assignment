import client from "prom-client";

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

let todos: Todo[] = [];
let nextId = 1;

const PORT = parseInt(process.env.PORT || "3000");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

/* -------------------- Logging -------------------- */
function log(level: "info" | "error", data: any) {
  if (LOG_LEVEL === "info" || level === "error") {
    console.log(JSON.stringify({ level, ...data }));
  }
}

/* -------------------- Metrics -------------------- */
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "status"],
});

register.registerMetric(httpRequests);

/* -------------------- Utils -------------------- */
async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function extractId(pathname: string): number | null {
  const parts = pathname.split("/");
  if (parts.length < 3) return null;

  const id = parseInt(parts[2]);
  return isNaN(id) ? null : id;
}

/* -------------------- Handler -------------------- */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // GET /health
  if (method === "GET" && pathname === "/health") {
    return Response.json({
      status: "ok",
      uptime: process.uptime(),
    });
  }

  // GET /metrics
  if (method === "GET" && pathname === "/metrics") {
    return new Response(await register.metrics(), {
      headers: { "Content-Type": register.contentType },
    });
  }

  // GET /todos
  if (method === "GET" && pathname === "/todos") {
    return Response.json(todos);
  }

  // POST /todos
  if (method === "POST" && pathname === "/todos") {
    const body = await safeJson(req);
    if (!body) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, done } = body;

    if (!title || typeof title !== "string") {
      return Response.json(
        { error: "title is required and must be a string" },
        { status: 400 }
      );
    }

    const todo: Todo = {
      id: nextId++,
      title,
      done: done ?? false,
    };

    todos.push(todo);
    return Response.json(todo, { status: 201 });
  }

  // PUT /todos/:id
  if (method === "PUT" && pathname.startsWith("/todos/")) {
    const id = extractId(pathname);
    if (id === null) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await safeJson(req);
    if (!body) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, done } = body;

    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    if (title !== undefined) {
      if (typeof title !== "string") {
        return Response.json(
          { error: "title must be a string" },
          { status: 400 }
        );
      }
      todo.title = title;
    }

    if (done !== undefined) {
      if (typeof done !== "boolean") {
        return Response.json(
          { error: "done must be a boolean" },
          { status: 400 }
        );
      }
      todo.done = done;
    }

    return Response.json(todo);
  }

  // DELETE /todos/:id
  if (method === "DELETE" && pathname.startsWith("/todos/")) {
    const id = extractId(pathname);
    if (id === null) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    todos.splice(index, 1);
    return new Response(null, { status: 204 });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

/* -------------------- Server -------------------- */
const server = Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const start = Date.now();

    let response: Response;

    try {
      response = await handleRequest(req);
    } catch (err) {
      log("error", { message: "Unhandled error", err });
      response = Response.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const latency = Date.now() - start;

    httpRequests.inc({
      method: req.method,
      status: response.status,
    });

    log("info", {
      method: req.method,
      path: new URL(req.url).pathname,
      status: response.status,
      latency_ms: latency,
    });

    return response;
  },
});

console.log(`Server running on http://localhost:${server.port}`);